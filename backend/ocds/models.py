from django.conf import settings
from django.db import models
from django.utils import timezone


class ProcuringEntity(models.Model):
    """
    Basic representation of an OCDS party acting as the buyer / procuring entity.
    """

    party_id = models.CharField(max_length=128, unique=True)
    name = models.CharField(max_length=512)
    contact_name = models.CharField(max_length=256, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=64, blank=True)

    def __str__(self) -> str:  
        return self.name


class Release(models.Model):
    """
    Stores individual OCDS releases from the National Treasury API.
    We keep raw JSON for traceability plus a few indexed fields for queries.
    """

    release_id = models.CharField(max_length=256, unique=True)
    ocid = models.CharField(max_length=256, db_index=True)
    date = models.DateTimeField()
    tag = models.JSONField(default=list, blank=True)
    initiation_type = models.CharField(max_length=64, blank=True)
    raw_json = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:  
        return self.release_id


class Tender(models.Model):
    """
    Normalised subset of OCDS tender data optimised for the supplier feed.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("complete", "Complete"),
        ("cancelled", "Cancelled"),
        ("planning", "Planning"),
        ("planned", "Planned"),
    ]

    release = models.OneToOneField(Release, related_name="tender", on_delete=models.CASCADE)

    tender_id = models.CharField(max_length=128, unique=True)
    ocid = models.CharField(max_length=256, db_index=True)
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="active", db_index=True)

    category = models.CharField(max_length=256, blank=True)
    additional_procurement_categories = models.JSONField(default=list, blank=True)

    province = models.CharField(max_length=128, blank=True, db_index=True)
    city = models.CharField(max_length=128, blank=True)

    value_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_index=True)
    value_currency = models.CharField(max_length=8, default="ZAR")

    tender_start_date = models.DateTimeField(null=True, blank=True)
    tender_end_date = models.DateTimeField(null=True, blank=True, db_index=True)

    procuring_entity = models.ForeignKey(
        ProcuringEntity,
        related_name="tenders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    cpv_codes = models.JSONField(default=list, blank=True)
    submission_methods = models.JSONField(default=list, blank=True)

    # Pre-computed match score for the "current" default profile (optional)
    match_score = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  
        return f"{self.tender_id} - {self.title[:50]}"


class TenderDocument(models.Model):
    """
    Associated OCDS documents (tender notices, bidding docs, etc.).
    """

    tender = models.ForeignKey(Tender, related_name="documents", on_delete=models.CASCADE)
    document_id = models.CharField(max_length=128)
    document_type = models.CharField(max_length=128, blank=True)
    title = models.CharField(max_length=512)
    url = models.URLField(max_length=1024)
    date_published = models.DateTimeField(null=True, blank=True)
    format = models.CharField(max_length=128, blank=True)

    class Meta:
        unique_together = ("tender", "document_id")

    def __str__(self) -> str:  #
        return self.title


class SupplierProfile(models.Model):
    """
    Supplier profile linked to a Django auth user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="supplier_profile",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    company_name = models.CharField(max_length=256)
    registration_number = models.CharField(max_length=64, blank=True)
    bbbee_level = models.CharField(max_length=32, blank=True)

    email = models.EmailField()
    phone = models.CharField(max_length=64, blank=True)

    province = models.CharField(max_length=128, blank=True)
    city = models.CharField(max_length=128, blank=True)

    preferred_cpvs = models.JSONField(default=list, blank=True)
    preferred_buyers = models.JSONField(default=list, blank=True)

    min_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    max_value = models.DecimalField(max_digits=18, decimal_places=2, default=100000000)

    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    whatsapp_notifications = models.BooleanField(default=False)

    # Admin controls
    is_paused = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.company_name


class SavedTender(models.Model):
    """
    Many-to-many like relationship between suppliers and tenders.
    """

    supplier = models.ForeignKey(SupplierProfile, related_name="saved_tenders", on_delete=models.CASCADE)
    tender = models.ForeignKey(Tender, related_name="saved_by", on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    calendar_added = models.BooleanField(default=False)

    class Meta:
        unique_together = ("supplier", "tender")


class IngestionRun(models.Model):
    """
    Tracks ingestion executions (manual or scheduled) for the admin dashboard.
    """

    SOURCE_CHOICES = [
        ("api", "OCDSReleases API"),
        ("bulk", "Bulk file import"),
    ]

    source = models.CharField(max_length=16, choices=SOURCE_CHOICES)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    items_ingested = models.PositiveIntegerField(default=0)
    items_failed = models.PositiveIntegerField(default=0)
    success = models.BooleanField(default=False)
    details = models.TextField(blank=True)


class IngestionError(models.Model):
    """
    Stores ingestion errors to drive the admin error table.
    """

    run = models.ForeignKey(
        IngestionRun,
        related_name="errors",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    occurred_at = models.DateTimeField(auto_now_add=True)
    release_id = models.CharField(max_length=256, blank=True)
    message = models.TextField()
    payload_snippet = models.TextField(blank=True)

