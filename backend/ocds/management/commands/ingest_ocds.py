from django.core.management.base import BaseCommand
from django.utils import timezone

from ocds.services import fetch_and_ingest_releases


class Command(BaseCommand):
    help = "Fetch and ingest the latest OCDS releases from National Treasury API."

    def add_arguments(self, parser):
        parser.add_argument(
            "--page-size",
            type=int,
            default=100,
            help="Number of releases to fetch per run (default: 100).",
        )

    def handle(self, *args, **options):
        page_size = options["page_size"]

        # Use today's date as date_to and one day back as date_from to keep it fresh
        today = timezone.now().date()
        date_to = today.isoformat()
        date_from = (today - timezone.timedelta(days=1)).isoformat()

        self.stdout.write(
            self.style.NOTICE(
                f"Starting OCDS ingestion for date range {date_from} to {date_to} (page_size={page_size})"
            )
        )

        run = fetch_and_ingest_releases(page_number=1, page_size=page_size, date_from=date_from, date_to=date_to)

        if run.success:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Ingestion run {run.id} completed successfully: {run.items_ingested} ingested, {run.items_failed} failed."
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"Ingestion run {run.id} completed with errors: {run.items_ingested} ingested, {run.items_failed} failed."
                )
            )

