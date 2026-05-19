const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com';

// I'll define common stage IDs here
export const WON_STAGES = ["71411668", "453484781"];
const TICKET_PROPERTIES = [
  "subject",
  "content",
  "hs_ticket_priority",
  "hs_ticket_category",
  "hs_pipeline",
  "hs_pipeline_stage",
  "createdate",
  "tipologia_incidencia",
  "tipologia",
  "sub_categorias_incidencias___aerotermia",
  "sub_categorias_incidencias",
  "sub_categoria_incidencia___cargador_coche_electrico",
  "tipologia_tramites",
];

export async function hubspotRequest(endpoint: string, options: RequestInit = {}) {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error('DEBUG: HUBSPOT_ACCESS_TOKEN is missing!');
    throw new Error('HUBSPOT_ACCESS_TOKEN is not defined');
  }

  console.log(`DEBUG: HubSpot Request -> ${endpoint}`);

  const response = await fetch(`${HUBSPOT_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`DEBUG: HubSpot Error ${response.status} ->`, JSON.stringify(errorData, null, 2));
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`DEBUG: HubSpot Success ${endpoint} -> Data received`);
  return data;
}

export async function getContactByEmail(email: string) {
  try {
    const data = await hubspotRequest(`/crm/v3/objects/contacts/${email}?idProperty=email&properties=firstname,lastname,email`);
    return data;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function getContactTickets(contactId: string) {
  try {
    const associations = await hubspotRequest(`/crm/v4/objects/contact/${contactId}/associations/ticket`);
    const ticketIds = associations.results.map((res: any) => res.toObjectId);
    if (ticketIds.length === 0) return [];

    const tickets = await hubspotRequest(`/crm/v3/objects/tickets/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        inputs: ticketIds.map((id: string) => ({ id })),
        properties: ["subject", "hs_pipeline_stage", "createdate"],
      }),
    });

    return tickets.results;
  } catch (error) {
    console.error(`Error fetching tickets for contact ${contactId}:`, error);
    return [];
  }
}

export async function getTicketsByContactId(contactId: string) {
  try {
    // 1. Get tickets directly associated with contact
    const contactAssoc = await hubspotRequest(`/crm/v4/objects/contact/${contactId}/associations/ticket`).catch(() => ({ results: [] }));
    const directTicketIds = contactAssoc.results.map((a: any) => a.toObjectId);

    // 2. Get tickets associated via deals
    const dealAssoc = await hubspotRequest(`/crm/v4/objects/contact/${contactId}/associations/deal`).catch(() => ({ results: [] }));
    const dealIds = dealAssoc.results.map((a: any) => a.toObjectId);
    
    let dealTicketIds: string[] = [];
    if (dealIds.length > 0) {
      const dealTicketAssocs = await Promise.all(
        dealIds.map((id: string) => 
          hubspotRequest(`/crm/v4/objects/deal/${id}/associations/ticket`).catch(() => ({ results: [] }))
        )
      );
      dealTicketIds = dealTicketAssocs.flatMap(assoc => assoc.results.map((a: any) => a.toObjectId));
    }

    // 3. Unique set of ticket IDs
    const allTicketIds = Array.from(new Set([...directTicketIds, ...dealTicketIds]));

    if (allTicketIds.length === 0) return [];

    // 4. Fetch ticket details in batch
    const tickets = await hubspotRequest(`/crm/v3/objects/tickets/batch/read`, {
      method: 'POST',
      body: JSON.stringify({
        inputs: allTicketIds.map((id: string) => ({ id })),
        properties: TICKET_PROPERTIES
      })
    });

    return tickets.results;
  } catch (error) {
    console.error(`Error in getTicketsByContactId for contact ${contactId}:`, error);
    return [];
  }
}

export async function createTicket(
  contactId: string, 
  { 
    subject, 
    content, 
    dealId, 
    properties = {},
    attachmentIds = [] 
  }: { 
    subject: string, 
    content: string, 
    dealId?: string,
    properties?: Record<string, any>,
    attachmentIds?: string[]
  }
) {
  // 1. Create ticket with dynamic properties
  const ticket = await hubspotRequest(`/crm/v3/objects/tickets`, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        subject,
        content,
        hs_pipeline: '0', // Default pipeline
        hs_pipeline_stage: '3', // Default "New" stage for tickets
        ...properties
      }
    })
  });

  // 2. Associate with contact
  await hubspotRequest(`/crm/v4/objects/ticket/${ticket.id}/associations/default/contact/${contactId}`, {
    method: 'PUT'
  });

  // 3. Associate with deal if provided
  if (dealId) {
    console.log(`DEBUG: Associating new ticket ${ticket.id} with deal ${dealId}`);
    await hubspotRequest(`/crm/v4/objects/ticket/${ticket.id}/associations/default/deal/${dealId}`, {
      method: 'PUT'
    });
  }

  // 4. Create an initial INCOMING_EMAIL so it shows up in the chat like a reply
  try {
    const email = await hubspotRequest(`/crm/v3/objects/emails`, {
      method: "POST",
      body: JSON.stringify({
        properties: {
          hs_email_direction: "INCOMING_EMAIL",
          hs_email_subject: subject,
          hs_email_text: content,
          hs_timestamp: new Date().toISOString(),
        }
      })
    });

    await hubspotRequest(`/crm/v4/objects/ticket/${ticket.id}/associations/default/email/${email.id}`, {
      method: "PUT"
    });
  } catch (emailError) {
    console.error("DEBUG: Failed to create initial email message, but ticket was created:", emailError);
  }

  // 5. Attach uploaded files to ticket through NOTE engagement associations
  if (attachmentIds.length > 0) {
    try {
      await createTicketAttachmentEngagement(ticket.id, attachmentIds, "");
    } catch (attachError) {
      console.error("DEBUG: Failed to associate attachments to ticket:", attachError);
    }
  }

  return ticket;
}

async function createTicketAttachmentEngagement(
  ticketId: string,
  attachmentIds: string[],
  body: string,
) {
  if (attachmentIds.length === 0) return null;

  const payload = {
    engagement: {
      active: true,
      type: "NOTE",
      timestamp: Date.now(),
    },
    associations: {
      contactIds: [],
      companyIds: [],
      dealIds: [],
      ownerIds: [],
      ticketIds: [Number(ticketId)],
    },
    attachments: attachmentIds.map((id) => ({ id: Number(id) })),
    metadata: {
      body,
    },
  };

  return hubspotRequest(`/engagements/v1/engagements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Uploads a file to HubSpot Files API v3
 * @param file The file object from a form
 * @returns The Hubspot File ID
 */
export async function uploadFile(file: File) {
  if (!HUBSPOT_ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is not defined');
  }

  console.log(`DEBUG: Uploading file to HubSpot: ${file.name} (${file.size} bytes)`);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('folderPath', '/portal-clientes');
  formData.append('options', JSON.stringify({
    access: 'PRIVATE',
    overwrite: false
  }));

  const response = await fetch(`${HUBSPOT_API_URL}/files/v3/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`DEBUG: HubSpot File Upload Error ${response.status}:`, errorBody);
    throw new Error(`HubSpot File upload error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`DEBUG: HubSpot File Upload Success -> ID: ${data.id}`);
  return data.id as string;
}

export async function getTicketMessages(ticketId: string) {
  try {
    console.log(`DEBUG: Fetching messages for Ticket ID: ${ticketId}`);
    const debugAllMessages =
      process.env.DEBUG_HUBSPOT_ALL_MESSAGES === "1" || process.env.NODE_ENV === "development";
    const debugMessageFilter =
      process.env.DEBUG_HUBSPOT_MESSAGE_FILTER === "1" || process.env.NODE_ENV === "development";

    // 0. Fetch ticket metadata
    await getTicket(ticketId);

    // 1. Get only email associations.
    // Notes and communications often contain internal-only context and should not be shown to clients.
    const emailAssoc = await hubspotRequest(`/crm/v4/objects/ticket/${ticketId}/associations/email`).catch((e) => {
      console.error("DEBUG: Email assoc error:", e.message);
      return { results: [] };
    });

    const emailIds = emailAssoc.results.map((res: any) => res.toObjectId);
    console.log(`DEBUG: Found assoc IDs - Emails: ${emailIds.length}`);

    // 2. Batch fetch email details
    const baseEmailProperties = [
      "hs_email_text",
      "hs_email_direction",
      "createdate",
      "hs_timestamp",
      "hs_email_subject",
      "hs_email_html",
      "hs_email_from_email",
      "hs_email_to_email",
      "hs_email_cc_email",
      "hs_email_headers",
    ];

    let emailProperties = baseEmailProperties;
    if (debugAllMessages && emailIds.length > 0) {
      try {
        const emailPropertyDefs = await hubspotRequest(`/crm/v3/properties/emails`);
        const allPropertyNames = (emailPropertyDefs.results || [])
          .map((p: any) => p.name)
          .filter(Boolean);
        if (allPropertyNames.length > 0) {
          emailProperties = allPropertyNames;
        }
        console.log(
          `DEBUG: Email properties loaded for diagnostics: ${emailProperties.length} properties`,
        );
      } catch (e: any) {
        console.error(`DEBUG: Failed to load all email properties: ${e.message}`);
      }
    }

    const emails = emailIds.length > 0
      ? await hubspotRequest(`/crm/v3/objects/emails/batch/read`, {
          method: "POST",
          body: JSON.stringify({
            inputs: emailIds.map((id: string) => ({ id })),
            properties: emailProperties,
          }),
        })
      : { results: [] };

    // 3. Resolve client emails from all associated contacts (not just first one)
    const ticketContactAssociations = await hubspotRequest(`/crm/v4/objects/ticket/${ticketId}/associations/contact`).catch(
      () => ({ results: [] }),
    );
    const associatedContactIds = ticketContactAssociations.results.map((r: any) => r.toObjectId);
    const associatedContacts =
      associatedContactIds.length > 0
        ? await hubspotRequest(`/crm/v3/objects/contacts/batch/read`, {
            method: "POST",
            body: JSON.stringify({
              inputs: associatedContactIds.map((id: string) => ({ id })),
              properties: ["email"],
            }),
          }).catch(() => ({ results: [] }))
        : { results: [] };

    // 4. Normalize messages
    const allMessages: any[] = [];

    const isInternalSolfyEmail = (email: string) =>
      email.endsWith("@solfy.net") || email.endsWith("@solfy.com");
    const extractEmails = (value: string) => {
      if (!value) return [] as string[];
      const lower = value.toLowerCase();
      const matches = lower.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g);
      if (matches && matches.length > 0) return matches;
      return lower
        .split(/[;,]/g)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const getHeaderEmails = (rawHeaders: string) => {
      if (!rawHeaders) return { from: [] as string[], to: [] as string[] };
      try {
        const parsed = JSON.parse(rawHeaders);
        return {
          from: extractEmails(parsed?.from || parsed?.sender?.email || ""),
          to: extractEmails(parsed?.to || parsed?.recipient || ""),
        };
      } catch {
        return {
          from: extractEmails(rawHeaders),
          to: extractEmails(rawHeaders),
        };
      }
    };

    const associatedContactEmails = (associatedContacts.results || [])
      .map((c: any) => (c.properties?.email || "").toLowerCase().trim())
      .filter(Boolean);
    let clientEmails = Array.from(
      new Set(associatedContactEmails.filter((email: string) => !isInternalSolfyEmail(email))),
    );

    if (clientEmails.length === 0) {
      const participantEmails = new Set<string>();
      for (const e of emails.results) {
        const fromList = extractEmails(e.properties?.hs_email_from_email || "");
        const toList = extractEmails(e.properties?.hs_email_to_email || "");
        const headerEmails = getHeaderEmails(e.properties?.hs_email_headers || "");
        [...fromList, ...toList, ...headerEmails.from, ...headerEmails.to].forEach((mail) => {
          if (mail && !isInternalSolfyEmail(mail)) participantEmails.add(mail);
        });
      }
      clientEmails = Array.from(participantEmails);
    }

    const extractLatestReply = (raw: string) => {
      if (!raw) return "";
      const normalized = raw.replace(/\r\n/g, "\n").trim();
      const cutMarkers = [
        /\nEl .+ escribió:\n/i,
        /\nOn .+ wrote:\n/i,
        /\nDe:\s.+\nEnviado:\s.+\nPara:\s.+\nAsunto:\s.+/i,
        /\nFrom:\s.+\nSent:\s.+\nTo:\s.+\nSubject:\s.+/i,
        /\n-----Original Message-----/i,
        /\n---------- Mensaje reenviado ---------/i,
      ];

      let cutIndex = -1;
      for (const marker of cutMarkers) {
        const match = normalized.match(marker);
        if (match && typeof match.index === "number") {
          if (cutIndex === -1 || match.index < cutIndex) {
            cutIndex = match.index;
          }
        }
      }

      const base = cutIndex >= 0 ? normalized.slice(0, cutIndex) : normalized;
      return base
        .split("\n")
        .filter((line) => !line.trim().startsWith(">"))
        .join("\n")
        .trim();
    };

    const filteredEmails = emails.results.filter((e: any) => {
      const fromList = extractEmails(e.properties?.hs_email_from_email || "");
      const toList = extractEmails(e.properties?.hs_email_to_email || "");
      const headerEmails = getHeaderEmails(e.properties?.hs_email_headers || "");
      const allFrom = [...fromList, ...headerEmails.from];
      const allTo = [...toList, ...headerEmails.to];
      const direction = (e.properties?.hs_email_direction || "").toUpperCase();
      const hasAnyParty = allFrom.length > 0 || allTo.length > 0;

      // Preserve portal-created initial message: often INCOMING_EMAIL without from/to metadata.
      if (!hasAnyParty && direction === "INCOMING_EMAIL") return true;
      if (clientEmails.length === 0) return true;
      const isFromClient = allFrom.some((p) => clientEmails.includes(p));
      const isToClient = allTo.some((p) => clientEmails.includes(p));
      return isFromClient || isToClient;
    });

    if (debugMessageFilter || debugAllMessages) {
      const excluded = emails.results
        .filter((e: any) => !filteredEmails.find((f: any) => f.id === e.id))
        .map((e: any) => ({
          id: e.id,
          direction: e.properties?.hs_email_direction,
          subject: e.properties?.hs_email_subject,
          from: e.properties?.hs_email_from_email,
          to: e.properties?.hs_email_to_email,
          cc: e.properties?.hs_email_cc_email,
          properties: e.properties || {},
        }));
      const included = filteredEmails.map((e: any) => ({
        id: e.id,
        direction: e.properties?.hs_email_direction,
        subject: e.properties?.hs_email_subject,
        from: e.properties?.hs_email_from_email,
        to: e.properties?.hs_email_to_email,
        cc: e.properties?.hs_email_cc_email,
        properties: e.properties || {},
      }));
      console.log(
        "DEBUG: Ticket message filter",
        JSON.stringify(
          {
            ticketId,
            associatedContactEmails,
            clientEmails,
            totalEmails: emails.results.length,
            visibleEmails: filteredEmails.length,
            includedEmails: included,
            excludedEmails: excluded,
          },
          null,
          2,
        ),
      );
    }

    allMessages.push(
      ...filteredEmails.map((e: any) => {
        const rawText = (e.properties.hs_email_text || e.properties.hs_email_html || "").replace(/<[^>]*>?/gm, '');
        const text = extractLatestReply(rawText);
        const fromEmail = (e.properties.hs_email_from_email || "").toLowerCase();
        const direction = (e.properties?.hs_email_direction || "").toUpperCase();
        const hasFromTo =
          Boolean((e.properties?.hs_email_from_email || "").trim()) ||
          Boolean((e.properties?.hs_email_to_email || "").trim());
        const sender =
          (!hasFromTo && direction === "INCOMING_EMAIL")
            ? "user"
            : (clientEmails.some((email) => fromEmail.includes(email)) ? "user" : "agent");

        return {
          id: e.id,
          text,
          sender,
          timestamp: e.properties.hs_timestamp || e.properties.createdate,
          type: 'email'
        };
      })
    );

    if (debugAllMessages) {
      const messageDebugRows = allMessages.map((m: any) => {
        const source = filteredEmails.find((e: any) => e.id === m.id);
        const direction = source?.properties?.hs_email_direction || "N/A";
        const from = source?.properties?.hs_email_from_email || "N/A";
        const to = source?.properties?.hs_email_to_email || "N/A";
        const preview = (m.text || "").replace(/\s+/g, " ").trim().slice(0, 240);
        return {
          id: m.id,
          messageType: m.type,
          senderMapped: m.sender,
          direction,
          from,
          to,
          cc: source?.properties?.hs_email_cc_email || "N/A",
          subject: source?.properties?.hs_email_subject || "N/A",
          timestampRaw: source?.properties?.hs_timestamp || source?.properties?.createdate || "N/A",
          createdAt: source?.createdAt || "N/A",
          updatedAt: source?.updatedAt || "N/A",
          archived: Boolean(source?.archived),
          properties: source?.properties || {},
          preview,
        };
      });
      console.log("DEBUG: Ticket message rows", JSON.stringify({ ticketId, rows: messageDebugRows }, null, 2));

      const rawEmailRows = emails.results.map((e: any) => ({
        id: e.id,
        createdAt: e.createdAt || e.properties?.createdate || null,
        updatedAt: e.updatedAt || null,
        archived: Boolean(e.archived),
        properties: e.properties || {},
      }));
      console.log(
        "DEBUG: Ticket raw email payload",
        JSON.stringify(
          {
            ticketId,
            totalEmails: rawEmailRows.length,
            propertyCount: emailProperties.length,
            rows: rawEmailRows,
          },
          null,
          2,
        ),
      );
    }

    const toTime = (value: string | undefined) => {
      const t = value ? new Date(value).getTime() : NaN;
      return Number.isFinite(t) ? t : 0;
    };

    console.log(`DEBUG: Normalized total messages: ${allMessages.length}`);
    return allMessages.sort((a, b) => toTime(a.timestamp) - toTime(b.timestamp));
  } catch (error) {
    console.error(`Error in getTicketMessages for ${ticketId}:`, error);
    return [];
  }
}

export async function sendTicketMessage(ticketId: string, message: string, attachmentIds: string[] = []) {
  try {
    console.log(`DEBUG: Sending message to Ticket ${ticketId} with ${attachmentIds.length} attachments`);
    
    // 1. Fetch current ticket to get the subject for the email
    const ticket = await getTicket(ticketId).catch(e => {
      console.error("DEBUG: Failed to fetch ticket for subject:", e.message);
      return null;
    });
    const subject = ticket?.properties?.subject || "Consulta desde el Portal";

    // 2. Create an Email object (INCOMING_EMAIL)
    console.log(`DEBUG: Creating INCOMING_EMAIL engagement...`);
    const email = await hubspotRequest(`/crm/v3/objects/emails`, {
      method: "POST",
      body: JSON.stringify({
        properties: {
          hs_email_direction: "INCOMING_EMAIL",
          hs_email_subject: `Re: ${subject}`,
          hs_email_text: message || "Archivo adjunto desde el portal",
          hs_email_html: message ? `<div>${message}</div>` : "<div>Archivo adjunto desde el portal</div>",
          hs_timestamp: new Date().toISOString(),
        }
      })
    });

    // 3. Associate Email with Ticket (using v4 default association)
    console.log(`DEBUG: Associating Email ${email.id} with Ticket ${ticketId}`);
    await hubspotRequest(`/crm/v4/objects/ticket/${ticketId}/associations/default/email/${email.id}`, {
      method: "PUT"
    });

    if (attachmentIds.length > 0) {
      await createTicketAttachmentEngagement(ticketId, attachmentIds, message || "");
    }

    return email;
  } catch (error) {
    console.error(`Error sending email message for ticket ${ticketId}:`, error);
    throw error;
  }
}

export async function getContactDeals(contactId: string) {
  try {
    // 1. Get associated Deal IDs
    // Using v4 associations API
    const associations = await hubspotRequest(`/crm/v4/objects/contact/${contactId}/associations/deal`);
    const dealIds = associations.results.map((res: any) => res.toObjectId);

    if (dealIds.length === 0) return [];

    // 2. Fetch Deal details in batch
    const deals = await hubspotRequest(`/crm/v3/objects/deals/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        inputs: dealIds.map((id: string) => ({ id })),
        properties: ["dealname", "dealstage", "amount"],
      }),
    });

    return deals.results;
  } catch (error) {
    console.error("HubSpot getContactDeals error:", error);
    return [];
  }
}

export async function getDeal(dealId: string) {
  return hubspotRequest(`/crm/v3/objects/deal/${dealId}?properties=dealname,dealstage,amount,hs_lastmodifieddate,codigo_de_expediente`);
}

export async function getTicket(ticketId: string) {
  return hubspotRequest(
    `/crm/v3/objects/ticket/${ticketId}?properties=${TICKET_PROPERTIES.join(",")}`,
  );
}

export async function getDealTickets(dealId: string) {
  try {
    console.log(`DEBUG: Fetching tickets for Deal ID: ${dealId}`);
    const associations = await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/ticket`);
    const ticketIds = associations.results.map((res: any) => res.toObjectId);

    console.log(`DEBUG: Found ${ticketIds.length} tickets for deal ${dealId}`);

    if (ticketIds.length === 0) return [];

    const tickets = await hubspotRequest(`/crm/v3/objects/tickets/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        inputs: ticketIds.map((id: string) => ({ id })),
        properties: TICKET_PROPERTIES,
      }),
    });

    return tickets.results;
  } catch (error) {
    console.error(`Error fetching tickets for deal ${dealId}:`, error);
    return [];
  }
}

export async function getTicketContact(ticketId: string) {
  try {
    const associations = await hubspotRequest(`/crm/v4/objects/ticket/${ticketId}/associations/contact`);
    const contactId = associations.results?.[0]?.toObjectId;
    if (!contactId) return null;

    const contact = await hubspotRequest(`/crm/v3/objects/contact/${contactId}?properties=firstname,lastname,email,phone,city,hubspot_owner_id`);
    return contact;
  } catch (error) {
    console.error(`Error fetching contact for ticket ${ticketId}:`, error);
    return null;
  }
}
