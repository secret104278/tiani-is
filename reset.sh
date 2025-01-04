set -xe

if [ ! -f vercel_backup.dump ]; then
    echo "Dumping dev database"
    docker run -v $PWD:/workspace postgres:15.5-alpine \
        pg_dump "postgres://default:sZnILS26DvHO@ep-fancy-lake-11417794.ap-southeast-1.postgres.vercel-storage.com/verceldb" \
        -F c \
        --exclude-table=_prisma_migrations \
        -f /workspace/vercel_backup.dump
fi

echo "Restoring local database"
pnpm exec prisma migrate reset --force
docker run -v $PWD:/workspace postgres:15.5-alpine \
    pg_restore -d "postgres://postgres:mysecretpassword@host.docker.internal:15432/mydb" -F c -c /workspace/vercel_backup.dump
