from django.contrib import admin

from .models import (
    ProcuringEntity,
    Release,
    Tender,
    TenderDocument,
    SupplierProfile,
    SavedTender,
    IngestionRun,
    IngestionError,
)


@admin.register(ProcuringEntity)
class ProcuringEntityAdmin(admin.ModelAdmin):
    list_display = ("party_id", "name", "contact_email")
    search_fields = ("party_id", "name", "contact_email")


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = ("release_id", "ocid", "date", "initiation_type")
    search_fields = ("release_id", "ocid")
    list_filter = ("initiation_type",)


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ("tender_id", "title", "province", "value_amount", "status", "match_score")
    search_fields = ("tender_id", "title", "description", "province", "city")
    list_filter = ("status", "province")


@admin.register(TenderDocument)
class TenderDocumentAdmin(admin.ModelAdmin):
    list_display = ("document_id", "title", "document_type", "tender")
    search_fields = ("document_id", "title", "document_type")


@admin.register(SupplierProfile)
class SupplierProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "email", "province", "city", "user")
    search_fields = ("company_name", "email", "province", "city", "user__email")


@admin.register(SavedTender)
class SavedTenderAdmin(admin.ModelAdmin):
    list_display = ("supplier", "tender", "saved_at", "calendar_added")
    search_fields = ("supplier__company_name", "tender__tender_id")


@admin.register(IngestionRun)
class IngestionRunAdmin(admin.ModelAdmin):
    list_display = ("source", "started_at", "finished_at", "items_ingested", "items_failed", "success")
    list_filter = ("source", "success")


@admin.register(IngestionError)
class IngestionErrorAdmin(admin.ModelAdmin):
    list_display = ("occurred_at", "release_id", "message", "run")
    search_fields = ("release_id", "message")
