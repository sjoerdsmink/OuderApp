import axios from 'axios';
import * as path from "jsr:@std/path";
import {PhotoUrl, sleep} from "./utils.ts";

export const fetchAllStories = async (orgSlug: string, authToken: string, basePath: string, startIndex = 0, maxIndex= Infinity) => {
  await Deno.mkdir(path.join(basePath, "data", "stories"), {recursive: true});

  let currentIndex = startIndex;
  let storyLength = -1;
  while (storyLength !== 0 && currentIndex <= maxIndex) {
    const res = await fetchStory(orgSlug, authToken, basePath, currentIndex);
    storyLength = res.storyLength;
    if (storyLength !== 0) {
      await sleep(0.2)
      currentIndex += storyLength
    }
  }
  console.log(`${currentIndex} stories fetched successfully`)
}

const fetchStory = async (orgSlug: string, authToken: string, basePath: string, index: number) => {
  // console.log(`Fetching stories for index ${index}`);
  try {
    const url = `https://${orgSlug}.ouderportaal.nl/restservices-parent/timeline/cards/v2/${index}`;
    const response = await axios.get(url, {headers: { Authorization: authToken }});
    await Deno.writeTextFile(path.join(basePath, "data", "stories", `${index}.json`), JSON.stringify(response.data));
    const storyLength = response.data.length;
    console.log(`Found ${storyLength} stories for index ${index}`);
    return { storyLength, json: response.data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.info(`Error fetching data (probably finished downloading all stories): ${errorMessage}`);
    return {storyLength: 0, json: undefined}
  }
}

export const getPhotoUrlsFromStories = async (basePath: string): Promise<PhotoUrl[]> => {
  const urls: PhotoUrl[] = [];
  for await (const dirEntry of Deno.readDir(path.join(basePath, "data", "stories"))) {
    if (dirEntry.isFile && dirEntry.name.endsWith('.json')) {
      const data = await Deno.readFile(path.join(basePath, "data", "stories", dirEntry.name))
      const text = new TextDecoder().decode(data);
      urls.push(...getPhotoUrls(text, dirEntry.name));
    }
  }
  return urls;
}

const getPhotoUrls = (text: string, fileName: string): PhotoUrl[] => {
  const json = JSON.parse(text);
  let urls: PhotoUrl[] = [];
  for (const elm of json) {
    if (!elm.children) {
      throw new Error(`Error ${fileName} No children found in message: ${JSON.stringify(elm)}`)
    }
    for (const child of elm.children) {
      // Add avatar, so we can check the total fullSizeUrl count
      urls.push({
        child: child.firstName,
        date: elm?.date,
        url: child.avatars?.fullSizeUrl,
      })
    }
    const childName = elm.children.map((child: any) => child.firstName).join(', ');

    for (const photo of elm.photos ?? []) {
      urls.push({
        child: childName,
        date: photo.date,
        url: photo.fullSizeUrl,
      })
    }

    for (const photo of elm.journal?.photos ?? []) {
      urls.push({
        child: childName,
        date: elm.journal.date,
        url: photo.fullSizeUrl,
      })
    }
  }

  const countFullSizeUrls = text.match(/fullSizeUrl/g)?.length?? 0;
  if (countFullSizeUrls !== urls.length) {
    console.error(`Error: ${fileName} Found ${countFullSizeUrls} fullSizeUrl(s) in the JSON, but expected ${urls.length}`);
  }
  return urls
}

