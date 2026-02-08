from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Tender,
    TenderDocument,
    SupplierProfile,
    SavedTender,
    IngestionRun,
    IngestionError,
)
from .services import compute_match_score


class TenderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDocument
        fields = [
            "document_id",
            "document_type",
            "title",
            "url",
            "date_published",
            "format",
        ]


class ProcuringEntitySerializer(serializers.Serializer):
    """
    We do not expose the whole ProcuringEntity model; instead we embed
    just enough fields to match the frontend `ProcuringEntity` type.
    """

    id = serializers.CharField(source="party_id")
    name = serializers.CharField()
    contactPoint = serializers.SerializerMethodField()

    def get_contactPoint(self, obj):
        if not (obj.contact_name or obj.contact_email or obj.contact_phone):
            return None
        return {
            "name": obj.contact_name,
            "email": obj.contact_email,
            "telephone": obj.contact_phone,
        }


class TenderSerializer(serializers.ModelSerializer):
    procuringEntity = ProcuringEntitySerializer(source="procuring_entity", read_only=True)
    documents = TenderDocumentSerializer(many=True, read_only=True)
    value = serializers.SerializerMethodField()
    tenderPeriod = serializers.SerializerMethodField()
    cpvCodes = serializers.ListField(source="cpv_codes")
    submissionMethod = serializers.ListField(source="submission_methods")
    matchScore = serializers.SerializerMethodField()
    briefingSession = serializers.SerializerMethodField()
    deliveryLocation = serializers.SerializerMethodField()
    procurementMethod = serializers.SerializerMethodField()
    procurementMethodDetails = serializers.SerializerMethodField()
    specialConditions = serializers.SerializerMethodField()
    contactPerson = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = [
            "tender_id",
            "ocid",
            "title",
            "description",
            "status",
            "category",
            "additional_procurement_categories",
            "province",
            "city",
            "value",
            "tenderPeriod",
            "procuringEntity",
            "documents",
            "matchScore",
            "cpvCodes",
            "submissionMethod",
            "briefingSession",
            "deliveryLocation",
            "procurementMethod",
            "procurementMethodDetails",
            "specialConditions",
            "contactPerson",
        ]

    def get_value(self, obj):
        if obj.value_amount is None:
            return None
        return {
            "amount": float(obj.value_amount),
            "currency": obj.value_currency,
        }

    def get_tenderPeriod(self, obj):
        if not (obj.tender_start_date or obj.tender_end_date):
            return None
        return {
            "startDate": obj.tender_start_date,
            "endDate": obj.tender_end_date,
        }

    def _get_raw_tender_data(self, obj):
        """Extract tender data from the release's raw JSON."""
        if not obj.release or not obj.release.raw_json:
            return {}
        return obj.release.raw_json.get("tender") or {}

    def get_briefingSession(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        briefing = tender_data.get("briefingSession") or {}
        if not briefing or briefing.get("date") == "0001-01-01T00:00:00Z":
            return None
        return {
            "date": briefing.get("date"),
            "venue": briefing.get("venue"),
            "isSession": briefing.get("isSession", False),
            "compulsory": briefing.get("compulsory", False),
        }

    def get_deliveryLocation(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        return tender_data.get("deliveryLocation") or None

    def get_procurementMethod(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        return tender_data.get("procurementMethod") or None

    def get_procurementMethodDetails(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        return tender_data.get("procurementMethodDetails") or None

    def get_specialConditions(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        conditions = tender_data.get("specialConditions")
        if conditions and conditions != "N/A":
            return conditions
        return None

    def get_contactPerson(self, obj):
        tender_data = self._get_raw_tender_data(obj)
        contact = tender_data.get("contactPerson") or {}
        if not contact or not contact.get("name"):
            return None
        return {
            "name": contact.get("name"),
            "email": contact.get("email"),
            "telephone": contact.get("telephoneNumber") or contact.get("telephone"),
        }

    def get_matchScore(self, obj):
        """
        Compute match score dynamically based on the current user's profile.
        Falls back to stored match_score if no user context is available.
        """
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            try:
                # Imported here to avoid circular dependency with views.py
                from .views import get_or_create_profile_for_user
                profile = get_or_create_profile_for_user(request.user)
                return compute_match_score(obj, profile)
            except Exception:
                pass
        
        # Fallback to default profile or stored score
        try:
            from .views import get_default_profile
            profile = get_default_profile()
            return compute_match_score(obj, profile)
        except Exception:
            # return stored score if available
            return obj.match_score


class ReleaseSerializer(serializers.Serializer):
    """
    Lightweight wrapper to match the frontend `Release` type.
    """

    id = serializers.CharField(source="release_id")
    date = serializers.DateTimeField()
    tag = serializers.ListField()
    initiationType = serializers.CharField(source="initiation_type")
    tender = TenderSerializer()


class SupplierProfileSerializer(serializers.ModelSerializer):
    # Expose camelCase fields to match frontend types while mapping to model's snake_case
    companyName = serializers.CharField(source="company_name")
    registrationNumber = serializers.CharField(source="registration_number", required=False, allow_blank=True)
    bbbeeLevel = serializers.CharField(source="bbbee_level", required=False, allow_blank=True)

    preferredCPVs = serializers.ListField(source="preferred_cpvs")
    preferredBuyers = serializers.ListField(source="preferred_buyers")
    minValue = serializers.DecimalField(source="min_value", max_digits=18, decimal_places=2)
    maxValue = serializers.DecimalField(source="max_value", max_digits=18, decimal_places=2)
    emailNotifications = serializers.BooleanField(source="email_notifications")
    smsNotifications = serializers.BooleanField(source="sms_notifications")
    whatsappNotifications = serializers.BooleanField(source="whatsapp_notifications")
    isPaused = serializers.BooleanField(source="is_paused")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = SupplierProfile
        fields = [
            "id",
            "companyName",
            "registrationNumber",
            "bbbeeLevel",
            "email",
            "phone",
            "province",
            "city",
            "preferredCPVs",
            "preferredBuyers",
            "minValue",
            "maxValue",
            "emailNotifications",
            "smsNotifications",
            "whatsappNotifications",
            "isPaused",
            "createdAt",
            "updatedAt",
        ]


class SavedTenderSerializer(serializers.ModelSerializer):
    tenderId = serializers.CharField(source="tender.tender_id", read_only=True)
    savedAt = serializers.DateTimeField(source="saved_at", read_only=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    calendarAdded = serializers.BooleanField(source="calendar_added", required=False)

    class Meta:
        model = SavedTender
        fields = [
            "tenderId",
            "savedAt",
            "notes",
            "calendarAdded",
        ]


class IngestionRunSerializer(serializers.ModelSerializer):
    """
    Expose ingestion run history for the admin dashboard.
    """

    class Meta:
        model = IngestionRun
        fields = [
            "id",
            "source",
            "started_at",
            "finished_at",
            "items_ingested",
            "items_failed",
            "success",
            "details",
        ]


class IngestionSourceStatsSerializer(serializers.Serializer):
    name = serializers.CharField()
    lastSync = serializers.DateTimeField()
    itemCount = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["success", "error", "pending"])


class IngestionStatsSerializer(serializers.Serializer):
    lastFetch = serializers.DateTimeField()
    itemsIngested = serializers.IntegerField()
    itemsFailed = serializers.IntegerField()
    syncStatus = serializers.ChoiceField(choices=["idle", "running", "error"])
    sources = IngestionSourceStatsSerializer(many=True)


class IngestionErrorSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionError
        fields = ["occurred_at", "release_id", "message"]


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class RegisterSerializer(serializers.Serializer):
    """
    Simple registration serializer that creates a Django User and an
    associated SupplierProfile. Business fields can be enriched later
    via the SupplierProfile endpoint.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    company_name = serializers.CharField(required=False, allow_blank=True)
    registration_number = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        username = email

        user = User.objects.create_user(username=username, email=email)
        user.set_password(password)
        user.save()

        SupplierProfile.objects.create(
            user=user,
            email=email,
            company_name=validated_data.get("company_name", ""),
            registration_number=validated_data.get("registration_number", ""),
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


