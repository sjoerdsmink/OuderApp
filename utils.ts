import {TZDate} from "@date-fns/tz";
import {format} from "date-fns";

export const sleep = (seconds: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
    })


export interface PhotoUrl {
    child: string,
    date: number,
    url: string
}

export const timezone = "Europe/Amsterdam";

export const dateFormat = (epoch: number | undefined): string => {
    const tzDate = epoch? new TZDate(epoch, timezone) : new TZDate(new Date(), timezone);
    return format(tzDate, 'yyyy-MM-dd_HHmmss')
}