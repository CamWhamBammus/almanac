# Development notes

## After changing prisma/schema.prisma, restart the dev server

`next dev` holds the generated Prisma client in memory. Pushing a schema
change regenerates the client on disk but the running server keeps the old
one, so the app dies at runtime with e.g.
`PrismaClientValidationError: Unknown argument 'sortOrder'` — even though the
code, the schema and the database are all correct and `tsc` is clean. It looks
like a code bug and isn't one.

Always run both, in this order:

```
npx prisma db push
# then kill the `next dev -p 3001` process and start it again
```

Restarting is not optional and hot reload does not cover it. If the app throws
`Unknown argument '<field you just added>'`, check the server's uptime before
debugging anything else.

## Where the data lives

The SQLite database is outside the repo, at
`~/Library/Application Support/Almanac/almanac.db`, so it is never committed
and survives a clean checkout.
