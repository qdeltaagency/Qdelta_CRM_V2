import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  generateDocumentNotificationHtml,
  generatePaymentRequestHtml,
  generatePaymentReceiptHtml,
  generateOnboardingWelcomeHtml,
} from '@/lib/email-templates';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      to,
      subject,
      data,
      documentId,
      projectId,
      clientId,
      leadId,
    } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address (to) is required.' },
        { status: 400 }
      );
    }

    let htmlContent = '';
    let finalSubject = subject || 'Update from Qdelta Studio';

    switch (type) {
      case 'document_notification':
        htmlContent = generateDocumentNotificationHtml(data);
        if (!subject) {
          finalSubject = `${data.documentTitle || 'Document'} — Qdelta Studio`;
        }
        break;

      case 'payment_request':
        htmlContent = generatePaymentRequestHtml(data);
        if (!subject) {
          finalSubject = `Payment Request: ${data.projectTitle || 'Milestone Deposit'} — Qdelta Studio`;
        }
        break;

      case 'payment_receipt':
        htmlContent = generatePaymentReceiptHtml(data);
        if (!subject) {
          finalSubject = `Official Payment Receipt — ${data.projectTitle || 'Project'} — Qdelta Studio`;
        }
        break;

      case 'onboarding_welcome':
        htmlContent = generateOnboardingWelcomeHtml(data);
        if (!subject) {
          finalSubject = `Welcome to Qdelta Studio — Kickoff for ${data.projectTitle || 'Your Project'}`;
        }
        break;

      default:
        if (data?.html) {
          htmlContent = data.html;
        } else {
          htmlContent = generateDocumentNotificationHtml({
            clientName: data?.clientName || 'Valued Client',
            companyName: data?.companyName || null,
            projectTitle: data?.projectTitle || 'Project Deliverable',
            documentType: 'document',
            documentTitle: data?.documentTitle || 'Studio Document',
            documentUrl: data?.documentUrl || 'https://qdelta.agency',
            customMessage: data?.customMessage || 'A new document has been shared with you.',
          });
        }
        break;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    let resendResponse = null;
    let isSimulated = false;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        resendResponse = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Qdelta Studio <notifications@qdelta.agency>',
          to: Array.isArray(to) ? to : [to],
          subject: finalSubject,
          html: htmlContent,
        });
      } catch (sendErr: any) {
        console.warn('Resend API send error, falling back to simulated dispatch:', sendErr);
        isSimulated = true;
      }
    } else {
      // Graceful fallback simulation when RESEND_API_KEY is not configured yet
      isSimulated = true;
      console.log(`[Email Dispatch Simulated] To: ${to} | Subject: ${finalSubject}`);
    }

    // Update document status to 'sent' if documentId was passed
    if (documentId && supabase) {
      try {
        await supabase
          .from('documents')
          .update({
            status: 'sent',
            metadata: {
              sent_to: to,
              sent_at: new Date().toISOString(),
              subject: finalSubject,
            },
          })
          .eq('id', documentId);
      } catch (docErr) {
        console.warn('Could not update document status to sent:', docErr);
      }
    }

    // Log activity in Supabase
    if (supabase) {
      try {
        await supabase.from('activities').insert([
          {
            project_id: projectId || null,
            client_id: clientId || null,
            lead_id: leadId || null,
            type: 'email_sent',
            description: `Sent "${finalSubject}" to ${Array.isArray(to) ? to.join(', ') : to}${isSimulated ? ' (Simulated)' : ''}`,
          },
        ]);
      } catch (actErr) {
        console.warn('Could not log email activity:', actErr);
      }
    }

    return NextResponse.json({
      success: true,
      simulated: isSimulated,
      subject: finalSubject,
      to,
      resendId: resendResponse?.data?.id || null,
      message: isSimulated
        ? `Email notification simulated for ${to}. Add RESEND_API_KEY to send real production emails.`
        : `Email successfully sent to ${to}.`,
    });
  } catch (error: any) {
    console.error('Error in /api/email/send:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch email.' },
      { status: 500 }
    );
  }
}
