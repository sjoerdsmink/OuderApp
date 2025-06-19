import axios from 'axios';
import * as path from "jsr:@std/path";
import {dateFormat, PhotoUrl} from "./utils.ts";
import {fetchAllStories, getPhotoUrlsFromStories} from "./stories.ts";
import {fetchAllMessages, getPhotoUrlsFromMessages} from "./messages.ts";
import {fetchAllDocuments, downloadAllDocuments } from "./documents.ts";

const refreshAuthToken = async (orgSlug: string, username: string, password: string): Promise<string> => {
  const authToken = await login(orgSlug, username, password);
  if (!authToken) {
    throw new Error("Failed to login");
  }
  return authToken;
}

export const startBackup = async (orgSlug: string, username: string, password: string, basePath: string) => {
  let authToken = await refreshAuthToken(orgSlug, username, password);
  console.log("Login successful");

  await fetchAllStories(orgSlug, authToken, basePath);
  // Refreshing authToken as a precaution for slow computers/internet, because it's only valid for 15 minutes
  authToken = await refreshAuthToken(orgSlug, username, password);

  await fetchAllMessages(orgSlug, authToken, basePath);
  authToken = await refreshAuthToken(orgSlug, username, password);

  await fetchAllDocuments(orgSlug, authToken, basePath);
  await downloadAllDocuments(orgSlug, authToken, basePath);

  const photosStories = await getPhotoUrlsFromStories(basePath);
  const photosMessages = await getPhotoUrlsFromMessages(basePath);

  // Remove duplicate photos
  const uniquePhotos: PhotoUrl[] = [...photosStories, ...photosMessages].reduce((acc: PhotoUrl[], curr) => {
    if (!acc.find(photo => photo.url === curr.url)) {
      if (!curr.child || !curr.date || !curr.url) {
        console.error(`Error: Incomplete photoUrl: ${JSON.stringify(curr)}`);
      } else {
        acc.push(curr);
      }
    }
    return acc;
  }, [])

  // Download unique photos
  await downloadPhotos(uniquePhotos, basePath);
}

export const login = async (orgSlug: string, username: string, password: string): Promise<string | undefined> => {
  const data = { username, password };
  const res = await axios.put(`https://${orgSlug}.ouderportaal.nl/auth-api/login`, data).catch(e => {
    console.error("Error: Failed to login:", e.message);
    return undefined;
  });
  if (res?.status === 200 && res.data.authToken) {
    return `Bearer ${res.data.authToken}`;
  } else {
    return undefined
  }
}

const downloadPhotos = async (photoUrls: PhotoUrl[], basePath: string) => {
  const photosLength = photoUrls.length
  console.log(`Start downloading ${photosLength} photos`)
  for (let i = 0; i < photosLength; i++) {
    const photoUrl = photoUrls[i]
    const response = await axios.get(photoUrl.url, { responseType: 'arraybuffer' });
    let fileName = photoUrl.url.substring(photoUrl.url.lastIndexOf('/') + 1)
    fileName = fileName.substring(0, fileName.indexOf('?'));
    fileName = `${dateFormat(photoUrl.date)}_${fileName}`;
    await Deno.mkdir(path.join(basePath, "photos", photoUrl.child), {recursive: true});
    await Deno.writeFile(path.join(basePath, "photos", photoUrl.child, fileName), new Uint8Array(response.data));
    console.log(`Downloaded ${i+1}/${photosLength} ${fileName}`);
  }
  console.log("All photos downloaded successfully")
}
