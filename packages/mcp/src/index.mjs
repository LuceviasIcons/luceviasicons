#!/usr/bin/env node
/**
 * MCP server for the LUCEVIAS icon set.
 *
 * It lets an AI agent in an editor find an icon by meaning and get code that
 * compiles: the right component name, import and props. Without it the agent
 * guesses names from memory and writes imports of icons that do not exist.
 *
 * Runs over stdio — the transport every MCP client supports:
 *
 *   claude mcp add lucevias -- npx -y @luceviasicons/mcp
 *
 * The data comes from `@luceviasicons/core`, the same file the site and the
 * Figma plugin read. There is no second copy of the set.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import {
  ICONS,
  LATEST_DAY,
  VERSION,
  WEIGHTS,
  brief,
  categories,
  iconByName,
  search,
  suggest,
} from './icons.mjs'
import { snippets, toSvg } from './snippets.mjs'

const server = new Server(
  { name: 'lucevias-icons', version: VERSION },
  { capabilities: { tools: {} } },
)

/*
 * The tool descriptions are written for the agent, not for a person: it picks a
 * tool by them. Hence the explicit hints about when to reach for which — and the
 * warning not to invent names, which is the most common failure.
 */
const TOOLS = [
  {
    name: 'search_icons',
    description:
      `Search the LUCEVIAS icon set (${ICONS.length} icons) by name and tags. ` +
      'Use this FIRST, before writing any icon import: it returns the exact names ' +
      'that exist in the set. Never guess an icon name from memory. ' +
      'Returns names, categories and tags without markup — call get_icon for the code.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What the icon should depict: "cart", "user", "arrow left", "wifi".',
        },
        category: {
          type: 'string',
          description: 'Optional: narrow to one category, see list_categories.',
        },
        limit: {
          type: 'number',
          description: 'How many results to return, 20 by default.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_icon',
    description:
      'Get one icon by its exact name: ready-to-paste code for React, HTML and raw SVG. ' +
      'The name must come from search_icons. Use this when the icon is chosen and ' +
      'the code has to be written.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact icon name, for example "shopping-cart".' },
        weight: {
          type: 'string',
          description: `One of: ${WEIGHTS.join(', ')}. Defaults to regular.`,
        },
        size: { type: 'number', description: 'Size in pixels, 24 by default.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_categories',
    description:
      'List the categories of the set with icon counts. Useful when the task is to pick ' +
      'a whole group of icons — navigation, files, currencies — rather than a single one.',
    inputSchema: { type: 'object', properties: {} },
  },
]

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

/** Every tool answers with JSON: an agent parses it more reliably than prose. */
const json = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  if (name === 'search_icons') {
    const found = search(args.query, { category: args.category, limit: args.limit })
    return json({
      query: args.query,
      found: found.length,
      total: ICONS.length,
      icons: found.map(brief),
      /*
       * An empty result is an answer too, and the agent has to be told what to do
       * next — otherwise it falls back to inventing a name.
       */
      hint: found.length
        ? 'Call get_icon with one of these names to get the code.'
        : 'Nothing found. Try another word or check list_categories.',
    })
  }

  if (name === 'get_icon') {
    const icon = iconByName(args.name)
    if (!icon) {
      /*
       * A near miss is more useful than a bare "not found": the agent has
       * usually produced a name close to a real one, and without a hint it
       * would try inventing another.
       */
      const close = suggest(args.name)
      /*
       * When nothing is close, the name is not a typo — there is no such icon in
       * the set. Then the words of the name are the best query to search by.
       */
      const words = String(args.name).split(/[-_\s]+/).filter(Boolean)
      const related = close.length
        ? []
        : [...new Set(words.flatMap((w) => search(w, { limit: 3 }).map((i) => i.name)))].slice(0, 6)

      return json({
        error: `No icon named "${args.name}" in the set.`,
        did_you_mean: close,
        related,
        hint: close.length
          ? 'One of these is probably the icon you meant.'
          : 'Nothing close. Call search_icons with a word describing the icon.',
      })
    }

    const weight = icon.variants[args.weight] ? args.weight : 'regular'
    const size = args.size ?? 24
    return json({
      name: icon.name,
      category: icon.category,
      tags: icon.tags,
      weights: Object.keys(icon.variants),
      weight,
      size,
      code: snippets(icon, { weight, size }),
      svg: toSvg(icon, { weight, size }),
    })
  }

  if (name === 'list_categories') {
    return json({ total: ICONS.length, updated: LATEST_DAY, categories: categories() })
  }

  return json({ error: `Unknown tool: ${name}` })
})

/*
 * stdio is the transport, so stdout carries the protocol: anything printed there
 * would corrupt the stream. Diagnostics go to stderr, which the client shows in
 * its logs.
 */
const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`lucevias-mcp: ${ICONS.length} icons, set ${VERSION}`)
