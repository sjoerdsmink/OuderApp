import axios from 'axios';
import {TZDate} from "@date-fns/tz";
import {format} from "date-fns";
import * as path from "jsr:@std/path";
import {PhotoUrl} from "./utils.ts";
import {fetchAllStories, getPhotoUrlsFromStories} from "./stories.ts";
import {fetchAllMessages, getPhotoUrlsFromMessages} from "./messages.ts";

export const startBackup = async (orgSlug: string, username: string, password: string, basePath: string) => {
  const authToken = await login(orgSlug, username, password);
  if (!authToken) {
    return;
  }
  console.log("Login successful");
  await fetchAllStories(orgSlug, authToken, basePath);
  await fetchAllMessages(orgSlug, authToken, basePath);

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
  for (let i = 0; i < photosLength - 1; i++) {
    const photoUrl = photoUrls[i]
    const response = await axios.get(photoUrl.url, { responseType: 'arraybuffer' });
    let fileName = photoUrl.url.substring(photoUrl.url.lastIndexOf('/') + 1)
    fileName = fileName.substring(0, fileName.indexOf('?'));
    if (photoUrl.date) {
      const date = format(new TZDate(photoUrl.date, "Europe/Amsterdam"), 'yyyy-MM-dd_HHmmss')
      fileName = `${date}_${fileName}`;
    }
    await Deno.mkdir(path.join(basePath, "downloads", photoUrl.child), {recursive: true});
    await Deno.writeFile(path.join(basePath, "downloads", photoUrl.child, fileName), new Uint8Array(response.data));
    console.log(`Downloaded ${i+1}/${photosLength} ${fileName}`);
  }
  console.log("All photos downloaded successfully")
}
