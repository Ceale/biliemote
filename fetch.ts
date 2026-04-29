import * as fs from "node:fs/promises"
import { uri, tryCatch } from "@ceale/util"
import assert from "node:assert"


await fs.mkdir("data/", { recursive: true })
await fs.mkdir("data/inedx", { recursive: true })
await fs.mkdir("data/file", { recursive: true })


function getEmoteList(a) {
    return a.emote ?? a.emotes
}


const a = await fs.readdir("dataset/")
const list1 = []
for (const b of a) {
    const c = uri.join("dataset/", b)
    console.log("read:", b)
    const d = await fs.readFile(c, "utf8")
    const e = JSON.parse(d)

    if (e.data.package) {
        list1.push(e.data.package)
    } else if (e.data.packages) {
        for (const f of e.data.packages) {
            list1.push(f)
        }
    } else {
        console.log("unknown data:", b)
    }
}
const set = new Set()
const list = []
for (const b of list1) {
    if (set.has(b.id)) {
    } else {
        set.add(b.id)
        list.push(b)
    }
}
console.log()

const skip = []
const success = []
const failure = []
for (const b of list) {
    await every(b)
}
console.log("skip:", skip.map(item => `#${item.id} ${item.text}`).join(", "))
console.log("success:", success.map(item => `#${item.id} ${item.text}`).join(", "))
console.log("failure:", failure.map(item => `#${item.id} ${item.text}`).join(", "))


async function every(a) {

    const b = await check(a)
    if (b) {
        console.log("skip:", a.id, a.text)
        skip.push(a)
    } else {
        console.log("fetch:", a.id, a.text)
        const c = await fetch(a)
        if (c) {
            success.push(a)
        } else {
            failure.push(a)
        }
    }
    console.log()
}


async function check(a) {
    const b= getEmoteList(a)
    const count = b.length
    const id = String(a.id)
    const path1 = uri.join("data/inedx", id + ".json")
    const path2 = uri.join("data/file", id)
    const exists1 = await fs.access(path1, fs.constants.F_OK).then(() => true).catch(() => false)
    const exists2 = await fs.access(path2, fs.constants.F_OK).then(() => true).catch(() => false)
    if (exists1 && exists2) {
        const actualCount = (await fs.readdir(path2)).length
        if (actualCount === count) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}


async function fetch(a) {
    const id = String(a.id)
    const name = a.text

    await fs.writeFile(
        uri.join("data/inedx", id + ".json"),
        JSON.stringify(a, null, 4),
        "utf8"
    )

    const b = getEmoteList(a)
    const path = uri.join("data/file/", id)
    await fs.mkdir(path, { recursive: true })
    for (const emote of b) {
        if (!emote.url?.startsWith("http")) continue
        const data = await global.fetch(emote.url).then(res => res.arrayBuffer())
        await fs.writeFile(
            uri.join(path, emote.id + "." + emote.url.split(".").at(-1)),
            Buffer.from(data)
        )
    }

    const count = b.filter(item => item.url.startsWith("http")).length
    const actualCount = (await fs.readdir(path)).length
    if (actualCount === count) {
        console.log("success", id, name, "count:", count)
        return true
    } else {
        console.log("failure", id, name, "count:", count, "actualCount:", actualCount)
        return false
    }
}
