import axios from 'axios';
import * as path from "jsr:@std/path";
import {dateFormat, PhotoUrl, sleep} from "./utils.ts";

export const fetchAllDocuments = async (orgSlug: string, authToken: string, basePath: string, startYear = (new Date()).getFullYear(), minYear= 2000) => {
  await Deno.mkdir(path.join(basePath, "data", "documents"), {recursive: true});

  let currentYear = startYear;
  let messageLength = -1;
  while (messageLength !== 0 && currentYear >= minYear) {
    const invoices = await fetchDocumentOverview(orgSlug, authToken, basePath, currentYear, "invoice");
    const annualStatements = await fetchDocumentOverview(orgSlug, authToken, basePath, currentYear, "annualstatement");
    const documents = await fetchDocumentOverview(orgSlug, authToken, basePath, currentYear, "document");
    messageLength = Math.max(invoices.messageLength, annualStatements.messageLength, documents.messageLength);
    if (messageLength !== 0) {
      await sleep(0.2)
      currentYear -= 1
    }
  }
  console.log(`${currentYear} document overview fetched successfully`)
}

const fetchDocumentOverview = async (orgSlug: string, authToken: string, basePath: string, year: number, type: string) => {
  // console.log(`Fetching document overview for index ${index}`);
  try {
    const url = `https://${orgSlug}.ouderportaal.nl/restservices-parent/administration/${type}/overview/${year}0101/${year}1231`;
    const response = await axios.get(url, {headers: { Authorization: authToken }});
    await Deno.writeTextFile(path.join(basePath, "data", "documents", `${type}-${year}.json`), JSON.stringify(response.data));
    const messageLength = response.data.payload.length;
    console.log(`Found ${messageLength} ${type}s for year ${year}`);
    return { messageLength, json: response.data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching ${type} data for year ${year}: ${errorMessage}`);
    return {messageLength: 0, json: undefined}
  }
}

interface Document {
  type: string;
  date: number;
  adminId: string;
  itemId: string;
  subject: string;
}

export const getDocumentFromMessages = async (basePath: string): Promise<Document[]> => {
  const documents: Document[] = [];
  for await (const dirEntry of Deno.readDir(path.join(basePath, "data", "documents"))) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.json')) {
      const data = await Deno.readFile(path.join(basePath, "data", "documents", dirEntry.name))
      const type = dirEntry.name.split('-')[0]
      const text = new TextDecoder().decode(data);
      documents.push(...getDocuments(text, dirEntry.name, type))
    }
  }

  for (const document of documents) {
    if (!document.type || !document.date || !document.adminId || !document.itemId || !document.subject) {
       console.error(`Error: Incomplete document ${document.type}: ${JSON.stringify(document)}`);
     }
  }

  return documents;
}

const getDocuments = (text: string, fileName: string, type: string): Document[] => {
  const json = JSON.parse(text);
  if (!json.payload) {
    console.error(`Error: ${fileName} No ${type} payload found in message: ${JSON.stringify(json.messages)}`);
    return []
  }
  let documents: Document[] = [];
  for (const item of json.payload) {
    if (item.hasAttachment) {
      documents.push({
        type,
        date: item.itemDate,
        adminId: item.adminId,
        itemId: item.itemId,
        subject: item.subject,
      })
    }
  }
  return documents
}

export const downloadAllDocuments = async (orgSlug: string, authToken: string, basePath: string) => {
  const documents = await getDocumentFromMessages(basePath);
  const documentsLength = documents.length;
  console.log(`Start downloading ${documentsLength} documents`);
  for (let i = 0; i < documents.length; i++) {
    await downloadDocument(orgSlug, authToken, basePath, documents[i]);
    console.log(`Downloaded ${i+1}/${documentsLength} ${documents[i].itemId}`);
  }
  console.log(`All documents downloaded successfully`)
}

const downloadDocument = async (orgSlug: string, authToken: string, basePath: string, document: Document) => {
  try {
    const url = `https://${orgSlug}.ouderportaal.nl/restservices-parent/administration/${document.adminId}/${document.type}/${document.itemId}`;
    const response = await axios.get(url, {headers: { Authorization: authToken }, responseType: 'arraybuffer' });
    let fileName = `${document.type}_${dateFormat(document.date)}_${document.subject}`
    if (!fileName.endsWith(".pdf")) {
      fileName = `${fileName}.pdf`
    }
    await Deno.writeFile(path.join(basePath, "documents", fileName), new Uint8Array(response.data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching document file ${JSON.stringify(document)}: ${errorMessage}`);
  }
}

