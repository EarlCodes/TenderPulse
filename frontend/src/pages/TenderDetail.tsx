import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { formatZAR, formatDate, getDaysRemaining } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  Calendar, 
  Building2, 
  MapPin, 
  Clock, 
  FileText, 
  Download,
  ExternalLink,
  Mail,
  Phone,
  Share2,
  AlertCircle,
  Hash,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTenderDetail, saveTender, deleteSavedTender } from '@/lib/api';
import type { Tender } from '@/types/tender';

const TenderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTenderDetail(id);
        if (!cancelled) {
          setTender(data);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load tender');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!tender && !loading) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tender Not Found</h2>
          <p className="text-muted-foreground mb-4">The tender you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Back to Feed</Button>
        </div>
      </AppLayout>
    );
  }

  if (!tender) {
    return (
      <AppLayout>
        <div className="p-6 text-muted-foreground text-sm">Loading tender…</div>
      </AppLayout>
    );
  }
  const daysRemaining = getDaysRemaining(tender.tenderPeriod.endDate);

  const getStatusInfo = () => {
    if (tender.status === 'complete' || tender.status === 'cancelled' || daysRemaining <= 0) {
      return { class: 'status-badge-closed', text: 'Closed' };
    }
    if (daysRemaining <= 7) {
      return { class: 'status-badge-closing', text: 'Closing Soon' };
    }
    return { class: 'status-badge-active', text: 'Open' };
  };

  const statusInfo = getStatusInfo();

  const handleSave = async () => {
    try {
      if (isSaved) {
        await deleteSavedTender(tender.id);
        setIsSaved(false);
        toast.success('Tender removed from saved');
      } else {
        await saveTender(tender.id);
        setIsSaved(true);
        toast.success('Tender saved successfully');
      }
    } catch (err) {
      toast.error('Failed to update saved tenders');
    }
  };

  const handleAddToCalendar = () => {
    const event = {
      title: `Tender Deadline: ${tender.title}`,
      start: new Date(tender.tenderPeriod.endDate),
      description: tender.description,
    };
    // In a real app, this would create an ICS file or integrate with Google Calendar
    toast.success('Deadline added to your calendar');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>

        {/* Header Card */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.text}
                </span>
                <Badge variant="secondary">{tender.category}</Badge>
                {Array.isArray(tender.additionalProcurementCategories) && tender.additionalProcurementCategories.length > 0 && (
                  tender.additionalProcurementCategories.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                  ))
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                {tender.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>{tender.procuringEntity.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{tender.city}, {tender.province}</span>
                </div>
              </div>
            </div>

            {/* Match Score */}
            {tender.matchScore && (
              <div className="flex items-center gap-3 bg-accent/50 rounded-xl p-4">
                <div className={`
                  match-score
                  ${tender.matchScore >= 80 ? 'match-score-high' : ''}
                  ${tender.matchScore >= 60 && tender.matchScore < 80 ? 'match-score-medium' : ''}
                  ${tender.matchScore < 60 ? 'match-score-low' : ''}
                `}>
                  {tender.matchScore}%
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Match Score</p>
                  <p className="text-xs text-muted-foreground">Based on your profile</p>
                </div>
              </div>
            )}
          </div>

          {/* Value and Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated Value</p>
              <p className="text-2xl font-bold text-primary">{formatZAR(tender.value.amount)}</p>
              {tender.value.currency && tender.value.currency !== 'ZAR' && (
                <p className="text-xs text-muted-foreground mt-1">{tender.value.currency}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Closing Date</p>
              <p className="text-lg font-semibold text-foreground">{formatDate(tender.tenderPeriod.endDate)}</p>
              {daysRemaining > 0 && (
                <p className={`text-sm ${daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {daysRemaining} days remaining
                </p>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tender ID</p>
              <p className="text-sm font-mono text-foreground break-all">{tender.id}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} variant={isSaved ? 'secondary' : 'default'} className="gap-2">
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? 'Saved' : 'Save Tender'}
            </Button>
            <Button onClick={handleAddToCalendar} variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{tender.description}</p>
            </div>

            {/* Documents */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Documents</h2>
              {tender.documents.length > 0 ? (
                <div className="space-y-3">
                  {tender.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.documentType} • {doc.format.split('/')[1]?.toUpperCase() || 'PDF'}
                            {doc.datePublished && ` • ${formatDate(doc.datePublished)}`}
                          </p>
                        </div>
                      </div>
                      {doc.url ? (
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" className="gap-2" disabled>
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No documents available</p>
              )}
            </div>

            {/* CPV Codes */}
            {Array.isArray(tender.cpvCodes) && tender.cpvCodes.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  CPV Codes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tender.cpvCodes.map((code) => (
                    <Badge key={code} variant="outline" className="font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Common Procurement Vocabulary codes used to classify this tender
                </p>
              </div>
            )}

            {/* Submission Methods */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Submission Methods</h2>
              {Array.isArray(tender.submissionMethod) && tender.submissionMethod.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tender.submissionMethod.map((method) => (
                    <Badge key={method} variant="secondary" className="capitalize">
                      {method === 'electronicSubmission' ? 'Electronic Submission' : method}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No submission methods specified</p>
              )}
            </div>

            {/* Procurement Method */}
            {(tender.procurementMethod || tender.procurementMethodDetails) && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Procurement Method</h2>
                <div className="space-y-2">
                  {tender.procurementMethod && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Method</p>
                      <Badge variant="outline" className="capitalize">
                        {tender.procurementMethod}
                      </Badge>
                    </div>
                  )}
                  {tender.procurementMethodDetails && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                      <p className="text-sm text-foreground">{tender.procurementMethodDetails}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Briefing Session */}
            {tender.briefingSession && tender.briefingSession.isSession && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Briefing Session
                </h2>
                <div className="space-y-3">
                  {tender.briefingSession.date && tender.briefingSession.date !== "0001-01-01T00:00:00Z" && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date & Time</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(tender.briefingSession.date)}</p>
                    </div>
                  )}
                  {tender.briefingSession.venue && tender.briefingSession.venue !== "N/A" && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Venue</p>
                      <p className="text-sm text-foreground">{tender.briefingSession.venue}</p>
                    </div>
                  )}
                  {tender.briefingSession.compulsory && (
                    <Badge variant="destructive" className="mt-2">
                      Compulsory Attendance Required
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Location */}
            {tender.deliveryLocation && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Location
                </h2>
                <p className="text-sm text-foreground">{tender.deliveryLocation}</p>
              </div>
            )}

            {/* Special Conditions */}
            {tender.specialConditions && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Special Conditions</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{tender.specialConditions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Procuring Entity</p>
                  <p className="font-medium text-foreground">{tender.procuringEntity.name}</p>
                </div>
                {(tender.procuringEntity.contactPoint || tender.contactPerson) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Contact Person</p>
                      <p className="font-medium text-foreground">
                        {tender.contactPerson?.name || tender.procuringEntity.contactPoint?.name}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {(tender.contactPerson?.email || tender.procuringEntity.contactPoint?.email) && (
                        <a 
                          href={`mailto:${tender.contactPerson?.email || tender.procuringEntity.contactPoint?.email}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {tender.contactPerson?.email || tender.procuringEntity.contactPoint?.email}
                        </a>
                      )}
                      {(tender.contactPerson?.telephone || tender.procuringEntity.contactPoint?.telephone) && (
                        <a 
                          href={`tel:${tender.contactPerson?.telephone || tender.procuringEntity.contactPoint?.telephone}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {tender.contactPerson?.telephone || tender.procuringEntity.contactPoint?.telephone}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-success mt-2" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Published</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tender.tenderPeriod.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${daysRemaining > 0 ? 'bg-warning animate-pulse-gentle' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Closing Date</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tender.tenderPeriod.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Additional Information
              </h2>
              <div className="space-y-3">
                {tender.ocid && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">OCID</p>
                    <p className="text-sm font-mono text-foreground break-all">{tender.ocid}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open Contracting ID
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <Badge variant={tender.status === 'active' ? 'default' : 'secondary'}>
                    {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                  </Badge>
                </div>
                {tender.procuringEntity.id && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Entity ID</p>
                      <p className="text-sm font-mono text-foreground">{tender.procuringEntity.id}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* External Link */}
            <Button className="w-full gap-2" variant="outline">
              <ExternalLink className="h-4 w-4" />
              View on eTenders Portal
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TenderDetail;
