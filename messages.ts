import axios from 'axios';
import * as path from "jsr:@std/path";
import {PhotoUrl, sleep} from "./utils.ts";

export const fetchAllMessages = async (orgSlug: string, authToken: string, basePath: string, startIndex = 0, maxIndex= Infinity) => {
  await Deno.mkdir(path.join(basePath, "messagesOverview"), {recursive: true});
  await Deno.mkdir(path.join(basePath, "messages"), {recursive: true});

  let currentIndex = startIndex;
  let messageLength = -1;
  while (messageLength !== 0 && currentIndex <= maxIndex) {
    const res = await fetchMessageOverview(orgSlug, authToken, basePath, currentIndex);
    messageLength = res.messageLength;
    if (messageLength !== 0) {
      await sleep(0.2)
      currentIndex += messageLength
    }
  }
  console.log(`${currentIndex} messages overview fetched successfully`)

  const messageIds = await getMessageIdsFromMessages(basePath);

  const messagesLength = messageIds.length;
  for (let i = 0; i < messagesLength-1; i++) {
    await sleep(0.2)
    console.log(`Fetching message ${i+1}/${messagesLength} for id ${messageIds[i]}`);
    await fetchMessage(orgSlug, authToken, basePath, messageIds[i]);
  }
}

const fetchMessageOverview = async (orgSlug: string, authToken: string, basePath: string, index: number) => {
  // console.log(`Fetching messages overview for index ${index}`);
  try {
    const url = `https://${orgSlug}.ouderportaal.nl/restservices-parent/logbook/overview?index=${index}`;
    const response = await axios.get(url, {headers: { Authorization: authToken }});
    await Deno.writeTextFile(path.join(basePath, "messagesOverview", `${index}.json`), JSON.stringify(response.data));
    const messageLength = response.data.length;
    console.log(`Found ${messageLength} messages for index ${index}`);
    return { messageLength, json: response.data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.info(`Error fetching data (probably finished downloading all messages): ${errorMessage}`);
    return {messageLength: 0, json: undefined}
  }
}

export const getMessageIdsFromMessages = async (basePath: string): Promise<string[]> => {
  const ids: string[] = [];
  for await (const dirEntry of Deno.readDir(path.join(basePath, "messagesOverview"))) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.json')) {
      const data = await Deno.readFile(path.join(basePath, "messagesOverview", dirEntry.name))
      const text = new TextDecoder().decode(data);
      for (const elm of JSON.parse(text)) {
        ids.push(elm.logMessageMessageId);
      }
    }
  }
  return ids;
}

const fetchMessage = async (orgSlug: string, authToken: string, basePath: string, messageId: string) => {
  try {
    const url = `https://${orgSlug}.ouderportaal.nl/restservices-parent/logbook/details/${messageId}/summary/false`;
    const response = await axios.get(url, {headers: { Authorization: authToken }});
    await Deno.writeTextFile(path.join(basePath, "messages", `${messageId}.json`), JSON.stringify(response.data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching message data: ${errorMessage}`);
  }
}

export const getPhotoUrlsFromMessages = async (basePath: string): Promise<PhotoUrl[]> => {
  const urls: PhotoUrl[] = [];
  for await (const dirEntry of Deno.readDir(path.join(basePath, "messages"))) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.json')) {
      const data = await Deno.readFile(path.join(basePath, "messages", dirEntry.name))
      const text = new TextDecoder().decode(data);
      urls.push(...getPhotoUrls(text, dirEntry.name));
    }
  }
  return urls;
}

const getPhotoUrls = (text: string, fileName: string): PhotoUrl[] => {
  const json = JSON.parse(text);
  if (json.messages?.length === 0) {
    console.error(`Error: ${fileName} No messages found in message: ${JSON.stringify(json.messages)}`);
    return []
  }
  let urls: PhotoUrl[] = [];
  for (const message of json.messages) {
    for (const elm of message.photos) {
      urls.push({
        child: message.childFirstName,
        date: message.date,
        url: elm.fullSizeUrl,
      })
    }
  }

  const countFullSizeUrls = text.match(/fullSizeUrl/g)?.length?? 0;
  if (countFullSizeUrls !== urls.length) {
    console.error(`Error: Found ${countFullSizeUrls} fullSizeUrl(s) in the JSON, but expected ${urls.length}`);
  }
  return urls
}

