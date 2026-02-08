from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("admin/auth/login/", views.AdminLoginView.as_view(), name="admin-login"),

    # Public tender feed & detail
    path("tenders/", views.TenderListView.as_view(), name="tender-list"),
    path("tenders/<str:tender_id>/", views.TenderDetailView.as_view(), name="tender-detail"),

    # Supplier profile & saved tenders
    path("supplier/profile/", views.SupplierProfileView.as_view(), name="supplier-profile"),
    path("supplier/saved-tenders/", views.SavedTenderListCreateView.as_view(), name="saved-tenders"),
    path(
        "supplier/saved-tenders/<str:tender_id>/",
        views.SavedTenderDeleteView.as_view(),
        name="saved-tender-delete",
    ),

    # Meta
    path("meta/categories/", views.CategoryListView.as_view(), name="category-list"),

    # Admin / ingestion
    path("admin/ingestion/stats/", views.IngestionStatsView.as_view(), name="ingestion-stats"),
    path("admin/ingestion/errors/", views.IngestionErrorListView.as_view(), name="ingestion-errors"),
    path("admin/ingestion/history/", views.IngestionHistoryView.as_view(), name="ingestion-history"),
    path("admin/ingestion/run/", views.RunIngestionView.as_view(), name="run-ingestion"),
    path("admin/ingestion/backfill/", views.BackfillIngestionView.as_view(), name="backfill-ingestion"),

    # Admin / suppliers
    path("admin/suppliers/", views.AdminSupplierListView.as_view(), name="admin-supplier-list"),
    path("admin/suppliers/<int:pk>/", views.AdminSupplierDetailView.as_view(), name="admin-supplier-detail"),
]

