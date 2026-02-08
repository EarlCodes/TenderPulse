import logging
import io
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

import requests
import pandas as pd
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

from .models import (
    Release,
    Tender,
    TenderDocument,
    ProcuringEntity,
    IngestionRun,
    IngestionError,
    SupplierProfile,
)

logger = logging.getLogger(__name__)


OCDS_API_BASE = "https://ocds-api.etenders.gov.za/api"
ETENDERS_DATA_BASE = "https://data.etenders.gov.za"


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:  
        return None


def upsert_release_from_payload(payload: dict, run: Optional[IngestionRun] = None) -> Optional[Release]:
    """
    Insert/update a single OCDS release + normalised Tender/documents.
    Returns the Release instance or None on an unrecoverable error.
    """
    release_id = payload.get("id")
    ocid = payload.get("ocid") or ""
    date_str = payload.get("date")
    date = _parse_date(date_str) or timezone.now()
    tag = payload.get("tag") or []
    initiation_type = payload.get("initiationType") or ""

    try:
        release, _created = Release.objects.update_or_create(
            release_id=release_id,
            defaults={
                "ocid": ocid,
                "date": date,
                "tag": tag,
                "initiation_type": initiation_type,
                "raw_json": payload,
                "last_seen": timezone.now(),
            },
        )

        tender_data = payload.get("tender") or {}

        # Procuring entity
        pe_data = (tender_data.get("procuringEntity") or {}) or {}
        pe_contact = pe_data.get("contactPoint") or {}
        procuring_entity = None
        if pe_data.get("id") or pe_data.get("name"):
            procuring_entity, _ = ProcuringEntity.objects.update_or_create(
                party_id=pe_data.get("id") or pe_data.get("name"),
                defaults={
                    "name": pe_data.get("name") or pe_data.get("id") or "",
                    "contact_name": pe_contact.get("name") or "",
                    "contact_email": pe_contact.get("email") or "",
                    "contact_phone": pe_contact.get("telephone") or "",
                },
            )

        tender_defaults = {
            "ocid": ocid,
            "title": tender_data.get("title") or "",
            "description": tender_data.get("description") or "",
            "status": (tender_data.get("status") or "active").lower(),
            "category": tender_data.get("mainProcurementCategory") or tender_data.get("category") or "",
            "additional_procurement_categories": tender_data.get("additionalProcurementCategories") or [],
            "province": tender_data.get("procuringRegion") or tender_data.get("province") or "",
            "city": tender_data.get("procuringCity") or tender_data.get("city") or "",
            "value_amount": (tender_data.get("value") or {}).get("amount"),
            "value_currency": (tender_data.get("value") or {}).get("currency") or "ZAR",
            "tender_start_date": _parse_date((tender_data.get("tenderPeriod") or {}).get("startDate")),
            "tender_end_date": _parse_date((tender_data.get("tenderPeriod") or {}).get("endDate")),
            "cpv_codes": tender_data.get("additionalClassifications") or tender_data.get("cpvCodes") or [],
            "submission_methods": tender_data.get("submissionMethod") or [],
            "procuring_entity": procuring_entity,
        }

        tender, _ = Tender.objects.update_or_create(
            release=release,
            defaults={
                "tender_id": tender_data.get("id") or release_id,
                **tender_defaults,
            },
        )

        # Documents
        TenderDocument.objects.filter(tender=tender).delete()
        for doc in tender_data.get("documents") or []:
            TenderDocument.objects.create(
                tender=tender,
                document_id=doc.get("id") or "",
                document_type=doc.get("documentType") or "",
                title=doc.get("title") or "",
                url=doc.get("url") or "",
                date_published=_parse_date(doc.get("datePublished")),
                format=doc.get("format") or "",
            )

        # update match score for default profile
        try:
            profile = SupplierProfile.objects.first()
            if profile:
                tender.match_score = compute_match_score(tender, profile)
                tender.save(update_fields=["match_score"])
        except Exception:
            logger.exception("Failed to compute match score")

        return release
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to upsert release %s", release_id)
        IngestionError.objects.create(
            run=run,
            release_id=release_id or "",
            message=str(exc),
            payload_snippet=str(payload)[:2000],
        )
        return None


def fetch_and_ingest_releases(
    page_number: int = 1,
    page_size: int = 100,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> IngestionRun:
    """
    Pulls a page of OCDS releases from the official API and ingests them.
    Designed for incremental updates and for the admin 'Run Ingestion' button.
    
    Args:
        page_number: Page number to fetch (default: 1)
        page_size: Number of items per page (default: 100)
        date_from: Start date in YYYY-MM-DD format (optional)
        date_to: End date in YYYY-MM-DD format (optional)
    """
    run = IngestionRun.objects.create(source="api")
    url = f"{OCDS_API_BASE}/OCDSReleases"
    params = {
        "PageNumber": page_number,
        "PageSize": page_size,
    }
    if date_from:
        params["dateFrom"] = date_from
    if date_to:
        params["dateTo"] = date_to

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        releases = data.get("releases") or []
        ingested = 0
        failed = 0
        for rel in releases:
            if upsert_release_from_payload(rel, run=run):
                ingested += 1
            else:
                failed += 1

        run.items_ingested = ingested
        run.items_failed = failed
        run.success = failed == 0
        run.finished_at = timezone.now()
        date_range = ""
        if date_from or date_to:
            date_range = f" ({date_from or 'start'} to {date_to or 'end'})"
        run.details = f"Fetched {len(releases)} releases from API{date_range}"
        run.save()
        return run
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to fetch OCDS releases")
        IngestionError.objects.create(
            run=run,
            message=str(exc),
            payload_snippet="OCDSReleases API call failed",
        )
        run.success = False
        run.finished_at = timezone.now()
        run.save()
        return run


def compute_match_score(tender: Tender, profile: SupplierProfile) -> int:
    """
    scoring function.
    Weighting (0-100 scale, coarse):
      - CPV / classification exact match (up to 40)
      - Keyword in title/description (up to 25)
      - Location match (up to 15)
      - Contract value in range (up to 10)
      - Buyer preference (up to 10)
      - Recency bonus (up to 10)
    """
    score = 0

    # CPV match
    preferred_cpvs = set(profile.preferred_cpvs or [])
    tender_cpvs = set(tender.cpv_codes or [])
    if preferred_cpvs and tender_cpvs:
        overlap = len(preferred_cpvs & tender_cpvs)
        if overlap:
            score += min(40, 20 + overlap * 10)

    # Keyword match
    keywords = [profile.company_name] + (profile.preferred_buyers or [])
    text = f"{tender.title} {tender.description}".lower()
    if text:
        hits = 0
        for kw in keywords:
            if kw and kw.lower() in text:
                hits += 1
        if hits:
            score += min(25, 10 + hits * 5)

    # Location
    if profile.province and profile.province.lower() == (tender.province or "").lower():
        score += 10
        if profile.city and profile.city.lower() == (tender.city or "").lower():
            score += 5

    # Value range
    if tender.value_amount is not None:
        if profile.min_value <= tender.value_amount <= profile.max_value:
            score += 10

    # Buyer preference
    if tender.procuring_entity and tender.procuring_entity.name in (profile.preferred_buyers or []):
        score += 10

    # Recency: newer tenders score higher based on days to closing
    if tender.tender_end_date:
        days_remaining = (tender.tender_end_date - timezone.now()).days
        if days_remaining >= 14:
            score += 10
        elif days_remaining >= 7:
            score += 7
        elif days_remaining >= 1:
            score += 4

    return max(0, min(100, int(score)))


def _convert_row_to_ocds_release(row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Convert a DataFrame row to OCDS release format.
    Handles various column name variations and data formats.
    """
    try:
        # Try to parse if row contains JSON string
        if isinstance(row.get("raw_json"), str):
            try:
                return json.loads(row["raw_json"])
            except json.JSONDecodeError:
                pass

        # Build OCDS release from flattened columns
        release_id = str(row.get("id") or row.get("release_id") or row.get("tender_id") or "")
        if not release_id:
            return None

        # Extract tender data from row
        tender_data = {
            "id": release_id,
            "title": str(row.get("title") or row.get("tender_title") or ""),
            "description": str(row.get("description") or row.get("tender_description") or ""),
            "status": str(row.get("status") or "active").lower(),
            "mainProcurementCategory": str(row.get("category") or row.get("main_procurement_category") or ""),
        }

        # Value
        value_amount = row.get("value_amount") or row.get("value") or row.get("amount")
        if value_amount:
            try:
                value_amount = float(value_amount)
            except (ValueError, TypeError):
                value_amount = None

        if value_amount:
            tender_data["value"] = {
                "amount": value_amount,
                "currency": str(row.get("value_currency") or row.get("currency") or "ZAR"),
            }

        # Dates
        tender_period = {}
        if row.get("tender_start_date") or row.get("start_date"):
            tender_period["startDate"] = str(row.get("tender_start_date") or row.get("start_date"))
        if row.get("tender_end_date") or row.get("end_date") or row.get("closing_date"):
            tender_period["endDate"] = str(row.get("tender_end_date") or row.get("end_date") or row.get("closing_date"))
        if tender_period:
            tender_data["tenderPeriod"] = tender_period

        # CPV codes
        cpv_codes = row.get("cpv_codes") or row.get("cpvCodes") or row.get("additional_classifications")
        if cpv_codes:
            if isinstance(cpv_codes, str):
                # Try to parse as JSON or comma-separated
                try:
                    cpv_codes = json.loads(cpv_codes)
                except json.JSONDecodeError:
                    cpv_codes = [c.strip() for c in cpv_codes.split(",") if c.strip()]
            if isinstance(cpv_codes, list):
                tender_data["additionalClassifications"] = cpv_codes

        # Province/City
        province = row.get("province") or row.get("procuring_region")
        city = row.get("city") or row.get("procuring_city")
        if province:
            tender_data["province"] = str(province)
        if city:
            tender_data["city"] = str(city)

        # Procuring entity
        pe_name = row.get("procuring_entity") or row.get("buyer") or row.get("procuring_entity_name")
        if pe_name:
            tender_data["procuringEntity"] = {
                "name": str(pe_name),
                "id": str(row.get("procuring_entity_id") or pe_name),
            }

        # Build release structure
        release = {
            "id": release_id,
            "ocid": str(row.get("ocid") or f"ocds-{release_id}"),
            "date": str(row.get("date") or row.get("release_date") or datetime.now().isoformat()),
            "tag": row.get("tag") or ["tender"],
            "initiationType": str(row.get("initiation_type") or "tender"),
            "tender": tender_data,
        }

        return release
    except Exception as exc:
        logger.exception("Failed to convert row to OCDS release")
        return None


def process_file_and_ingest(
    file_path: Optional[str] = None,
    file_content: Optional[bytes] = None,
    uploaded_file: Optional[UploadedFile] = None,
    file_url: Optional[str] = None,
    run: Optional[IngestionRun] = None,
) -> IngestionRun:
    """
    Process an Excel or CSV file containing tender/release data and ingest it.
    
    Supports:
    - File path (local file system)
    - File content (bytes)
    - Uploaded file (Django UploadedFile)
    - File URL (downloads from URL)
    
    Returns the IngestionRun with updated stats.
    """
    if not run:
        run = IngestionRun.objects.create(source="bulk")

    ingested = 0
    failed = 0
    file_name = "unknown"

    try:
        # Determine file source
        if uploaded_file:
            file_name = uploaded_file.name
            file_content = uploaded_file.read()
        elif file_url:
            file_name = file_url.split("/")[-1]
            resp = requests.get(file_url, timeout=60)
            resp.raise_for_status()
            file_content = resp.content
        elif file_path:
            file_name = Path(file_path).name
            with open(file_path, "rb") as f:
                file_content = f.read()
        elif file_content:
            file_name = "uploaded_file"
        else:
            raise ValueError("No file source provided")

        # Determine file type and read
        file_ext = Path(file_name).suffix.lower()
        if file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(io.BytesIO(file_content), engine="openpyxl")
        elif file_ext == ".csv":
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            # Try to auto-detect
            try:
                df = pd.read_excel(io.BytesIO(file_content), engine="openpyxl")
            except Exception:
                try:
                    df = pd.read_csv(io.BytesIO(file_content))
                except Exception:
                    raise ValueError(f"Unsupported file format: {file_ext}")

        # Convert DataFrame to list of dicts
        rows = df.to_dict(orient="records")
        total_rows = len(rows)

        # Process each row
        for idx, row in enumerate(rows):
            try:
                # Convert row to OCDS release format
                release_payload = _convert_row_to_ocds_release(row)
                if not release_payload:
                    failed += 1
                    IngestionError.objects.create(
                        run=run,
                        release_id=f"row_{idx}",
                        message="Failed to convert row to OCDS release format",
                        payload_snippet=str(row)[:500],
                    )
                    continue

                # Ingest using existing function
                if upsert_release_from_payload(release_payload, run=run):
                    ingested += 1
                else:
                    failed += 1
            except Exception as exc:
                logger.exception("Error processing row %d", idx)
                failed += 1
                IngestionError.objects.create(
                    run=run,
                    release_id=f"row_{idx}",
                    message=str(exc),
                    payload_snippet=str(row)[:500],
                )

        # Update run stats
        run.items_ingested = ingested
        run.items_failed = failed
        run.success = failed == 0
        run.finished_at = timezone.now()
        run.details = f"Processed {file_name}: {ingested} ingested, {failed} failed out of {total_rows} rows"
        run.save()

        return run

    except Exception as exc:
        logger.exception("Failed to process file %s", file_name)
        IngestionError.objects.create(
            run=run,
            message=f"File processing error: {str(exc)}",
            payload_snippet=f"File: {file_name}",
        )
        run.success = False
        run.items_failed = failed + 1
        run.finished_at = timezone.now()
        run.details = f"Failed to process {file_name}: {str(exc)}"
        run.save()
        return run

