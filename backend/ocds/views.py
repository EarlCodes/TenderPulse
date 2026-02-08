import logging

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from .models import Tender, SupplierProfile, SavedTender, IngestionRun, IngestionError
from .serializers import (
    ReleaseSerializer,
    TenderSerializer,
    SupplierProfileSerializer,
    SavedTenderSerializer,
    IngestionStatsSerializer,
    IngestionErrorSerializer,
    IngestionRunSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
)
from .services import fetch_and_ingest_releases, process_file_and_ingest, OCDS_API_BASE, ETENDERS_DATA_BASE

User = get_user_model()


def get_default_profile() -> SupplierProfile:
    
    profile, _ = SupplierProfile.objects.get_or_create(
        id=1,
        defaults={
            "company_name": "TechVentures (Pty) Ltd",
            "registration_number": "2019/123456/07",
            "bbbee_level": "Level 2",
            "email": "procurement@techventures.co.za",
            "phone": "+27 11 555 0123",
            "province": "Gauteng",
            "city": "Johannesburg",
            "preferred_cpvs": ["72000000", "33000000"],
            "preferred_buyers": ["Gauteng Department of Health", "City of Johannesburg"],
            "min_value": 500000,
            "max_value": 50000000,
            "email_notifications": True,
            "sms_notifications": False,
            "whatsapp_notifications": True,
        },
    )
    return profile


def get_or_create_profile_for_user(user: User) -> SupplierProfile:
    """
    Return the SupplierProfile for the authenticated user, creating it
    if needed. Falls back to the same defaults as `get_default_profile`
    for initial values.
    """
    profile, created = SupplierProfile.objects.get_or_create(
        user=user,
        defaults={
            "company_name": "New Supplier",
            "registration_number": "",
            "bbbee_level": "",
            "email": user.email or "",
            "phone": "",
            "province": "",
            "city": "",
            "preferred_cpvs": [],
            "preferred_buyers": [],
            "min_value": 0,
            "max_value": 100000000,
            "email_notifications": True,
            "sms_notifications": False,
            "whatsapp_notifications": False,
        },
    )
    return profile


class TenderListView(generics.ListAPIView):
    """
    Paginated tender feed powering the `TenderFeed`.
    """

    serializer_class = ReleaseSerializer

    def get_serializer_context(self):
        """Pass request context to serializer for user-specific match score computation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = Tender.objects.select_related("release", "procuring_entity").prefetch_related("documents")

        search = self.request.query_params.get("search") or ""
        categories = self.request.query_params.getlist("categories")
        provinces = self.request.query_params.getlist("provinces")
        status_list = self.request.query_params.getlist("status")
        min_value = self.request.query_params.get("minValue")
        max_value = self.request.query_params.get("maxValue")

        if search:
            search = search.lower()
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(procuring_entity__name__icontains=search)
            )

        if status_list:
            qs = qs.filter(status__in=status_list)

        if categories:
            # Filter by category name (matching actual API category field)
            qs = qs.filter(
                Q(category__in=categories) | Q(cpv_codes__overlap=categories)
            )

        if provinces:
            qs = qs.filter(province__in=provinces)

        if min_value:
            qs = qs.filter(value_amount__gte=min_value)
        if max_value:
            qs = qs.filter(value_amount__lte=max_value)

        # Order: by match_score desc then by closing date asc
        qs = qs.order_by("-match_score", "tender_end_date")

        # The ReleaseSerializer expects Release instances; annotate via `.release`
        return [t.release for t in qs]


class TenderDetailView(generics.RetrieveAPIView):
    """
    Detail endpoint for a single tender by its `tender_id`.
    """

    serializer_class = TenderSerializer
    lookup_field = "tender_id"
    lookup_url_kwarg = "tender_id"

    def get_serializer_context(self):
        """Pass request context to serializer for user-specific match score computation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        return Tender.objects.select_related("procuring_entity", "release").prefetch_related("documents")


class SupplierProfileView(APIView):
    """
    Get/update the (single) supplier profile for now.
    """

    def get(self, request):
        if request.user and request.user.is_authenticated:
            profile = get_or_create_profile_for_user(request.user)
        else:
            profile = get_default_profile()
        serializer = SupplierProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        if request.user and request.user.is_authenticated:
            profile = get_or_create_profile_for_user(request.user)
        else:
            profile = get_default_profile()
        serializer = SupplierProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SavedTenderListCreateView(APIView):
    """
    List and add saved tenders for the current user's profile.
    """

    def get(self, request):
        if request.user and request.user.is_authenticated:
            profile = get_or_create_profile_for_user(request.user)
        else:
            profile = get_default_profile()
        saved = SavedTender.objects.filter(supplier=profile).select_related("tender")
        data = [
            {
                "tenderId": s.tender.tender_id,
                "savedAt": s.saved_at,
                "notes": s.notes,
                "calendarAdded": s.calendar_added,
            }
            for s in saved
        ]
        return Response(data)
    

    def post(self, request):
        if request.user and request.user.is_authenticated:
            profile = get_or_create_profile_for_user(request.user)
        else:
            profile = get_default_profile()
        tender_id = request.data.get("tenderId")
        if not tender_id:
            return Response({"detail": "tenderId is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tender = Tender.objects.get(tender_id=tender_id)
        except Tender.DoesNotExist:
            return Response({"detail": "Tender not found"}, status=status.HTTP_404_NOT_FOUND)

        saved, _created = SavedTender.objects.get_or_create(
            supplier=profile,
            tender=tender,
        )
        serializer = SavedTenderSerializer(saved)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedTenderDeleteView(APIView):
    """
    Remove a saved tender for the default profile.
    """

    def delete(self, request, tender_id: str):
        if request.user and request.user.is_authenticated:
            profile = get_or_create_profile_for_user(request.user)
        else:
            profile = get_default_profile()
        SavedTender.objects.filter(supplier=profile, tender__tender_id=tender_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IngestionStatsView(APIView):
    """
    Aggregate ingestion runs to feed the AdminStatCards component.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        last_run = IngestionRun.objects.order_by("-started_at").first()
        if not last_run:
            payload = {
                "lastFetch": None,
                "itemsIngested": 0,
                "itemsFailed": 0,
                "syncStatus": "idle",
                "sources": [],
            }
            return Response(payload)

        payload = {
            "lastFetch": last_run.finished_at or last_run.started_at,
            "itemsIngested": last_run.items_ingested,
            "itemsFailed": last_run.items_failed,
            "syncStatus": "running" if last_run.finished_at is None else ("error" if not last_run.success else "idle"),
            "sources": [
                {
                    "name": "eTenders Portal",
                    "lastSync": last_run.finished_at or last_run.started_at,
                    "itemCount": last_run.items_ingested,
                    "status": "success" if last_run.success else "error",
                }
            ],
        }
        serializer = IngestionStatsSerializer(payload)
        return Response(serializer.data)


class IngestionErrorListView(generics.ListAPIView):
    """
    List recent ingestion errors for the admin error table.
    """

    serializer_class = IngestionErrorSerializer
    pagination_class = None
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return IngestionError.objects.select_related("run").order_by("-occurred_at")[:100]


class IngestionHistoryView(generics.ListAPIView):
    """
    List recent ingestion runs for the admin history view.
    """

    serializer_class = IngestionRunSerializer
    pagination_class = None
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return IngestionRun.objects.order_by("-started_at")[:50]


class AdminSupplierListView(generics.ListAPIView):
    """
    Admin-only list of supplier profiles.
    Supports basic search by company name, email, or province via ?search=.
    """

    serializer_class = SupplierProfileSerializer
    pagination_class = None
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = SupplierProfile.objects.all().order_by("company_name")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(company_name__icontains=search)
                | Q(email__icontains=search)
                | Q(province__icontains=search)
            )
        return qs


class AdminSupplierDetailView(generics.RetrieveUpdateAPIView):
    """
    Admin-only detail/update view for a single supplier profile.
    """

    serializer_class = SupplierProfileSerializer
    permission_classes = [IsAdminUser]
    queryset = SupplierProfile.objects.all()


class CategoryListView(APIView):
    """
    Public endpoint returning distinct tender categories from current data.
    Used by the frontend for dynamic category filters and profile preferences.
    """

    def get(self, request):
        categories = (
            Tender.objects.exclude(category="")
            .values_list("category", flat=True)
            .distinct()
            .order_by("category")
        )
        return Response(list(categories))


class RunIngestionView(APIView):
    """
    Trigger a single-page ingestion run from the OCDSReleases API.
    Supports optional date filtering via dateFrom and dateTo parameters.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        page_number = int(request.data.get("pageNumber", 1))
        page_size = int(request.data.get("pageSize", 100))
        date_from = request.data.get("dateFrom")  # Format: YYYY-MM-DD
        date_to = request.data.get("dateTo")  # Format: YYYY-MM-DD
        
        run = fetch_and_ingest_releases(
            page_number=page_number,
            page_size=page_size,
            date_from=date_from,
            date_to=date_to,
        )
        return Response(
            {
                "runId": run.id,
                "itemsIngested": run.items_ingested,
                "itemsFailed": run.items_failed,
                "success": run.success,
                "details": run.details,
            }
        )


class BackfillIngestionView(APIView):
    """
    Endpoint for bulk backfill from Excel/CSV files or API date ranges.
    Supports:
    - File uploads or fetching files from URLs
    - API-based backfill using dateFrom and dateTo parameters
    Processes asynchronously and returns immediately with 202 Accepted.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        month_file = request.data.get("fileName")
        file_url = request.data.get("fileUrl")
        uploaded_file = request.FILES.get("file")
        date_from = request.data.get("dateFrom")  # Format: YYYY-MM-DD
        date_to = request.data.get("dateTo")  # Format: YYYY-MM-DD

        # Create ingestion run
        run = IngestionRun.objects.create(
            source="bulk",
            items_ingested=0,
            items_failed=0,
            success=False,
            details=f"Bulk backfill started for {month_file or 'uploaded file' or f'{date_from} to {date_to}'}",
        )

        # Process file or API
        try:
            # Priority 1: File upload
            if uploaded_file:
                process_file_and_ingest(uploaded_file=uploaded_file, run=run)
            # Priority 2: File URL
            elif file_url:
                process_file_and_ingest(file_url=file_url, run=run)
            # Priority 3: API-based backfill with date range
            elif date_from and date_to:
                # Fetch from API using date range, paginating through all pages
                page_number = 1
                page_size = 100
                total_ingested = 0
                total_failed = 0
                
                while True:
                    page_run = fetch_and_ingest_releases(
                        page_number=page_number,
                        page_size=page_size,
                        date_from=date_from,
                        date_to=date_to,
                    )
                    total_ingested += page_run.items_ingested
                    total_failed += page_run.items_failed
                    
                    # If we got fewer items than page_size, we're done
                    if page_run.items_ingested < page_size:
                        break
                    page_number += 1
                
                # Update the main run with totals
                run.items_ingested = total_ingested
                run.items_failed = total_failed
                run.success = total_failed == 0
                run.finished_at = timezone.now()
                run.details = f"API backfill: {total_ingested} ingested, {total_failed} failed from {date_from} to {date_to}"
                run.save()
            # Priority 4: Try fileName as file from e-Tender Portal
            elif month_file:
                # Try multiple URL patterns for e-Tender Portal files
                # Pattern 1: Direct file download from ReleasesFiles
                url_patterns = [
                    f"{ETENDERS_DATA_BASE}/Home/DownloadReleaseFile?fileName={month_file}",
                    f"{ETENDERS_DATA_BASE}/Home/ReleasesFiles/{month_file}",
                    f"{ETENDERS_DATA_BASE}/api/ReleasesFiles/{month_file}",
                    f"{OCDS_API_BASE}/bulk/{month_file}",
                ]
                
                file_processed = False
                for constructed_url in url_patterns:
                    try:
                        process_file_and_ingest(file_url=constructed_url, run=run)
                        file_processed = True
                        break
                    except Exception as e:
                        logger.debug(f"Failed to fetch from {constructed_url}: {e}")
                        continue
                
                if not file_processed:
                    # If all URL patterns fail, try as local file path
                    try:
                        process_file_and_ingest(file_path=month_file, run=run)
                    except Exception as e:
                        raise ValueError(f"Could not process file {month_file} from any source: {str(e)}")
            else:
                raise ValueError("No file source or date range provided (fileName, fileUrl, file upload, or dateFrom/dateTo required)")

            # Refresh run from DB to get updated stats
            run.refresh_from_db()

            return Response(
                {
                    "runId": run.id,
                    "success": run.success,
                    "itemsIngested": run.items_ingested,
                    "itemsFailed": run.items_failed,
                    "details": run.details,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as exc:
            run.success = False
            run.finished_at = timezone.now()
            run.details = f"Failed to start backfill: {str(exc)}"
            run.save()
            return Response(
                {
                    "runId": run.id,
                    "success": False,
                    "details": run.details,
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class RegisterView(APIView):
    """
    Register a new user and associated supplier profile.
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Basic email/password login that returns an auth token.
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "token": token.key,
            }
        )


class AdminLoginView(APIView):
    """
    Admin-only login endpoint. Only staff or superuser accounts may log in here.
    """

    permission_classes: list = []  # Allow unauthenticated POST for login

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (user.is_staff or user.is_superuser):
            return Response(
                {"detail": "You do not have admin access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "token": token.key,
            }
        )

