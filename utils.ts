export const sleep = (seconds: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
    })


export interface PhotoUrl {
    child: string,
    date: number,
    url: string
}