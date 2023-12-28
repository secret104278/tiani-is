set -xe

docker run -v $PWD:/workspace postgres:15.5-alpine \
    pg_dump "postgres://default:sZnILS26DvHO@ep-fancy-lake-11417794.ap-southeast-1.postgres.vercel-storage.com/verceldb" -F c --exclude-table=_prisma_migrations -f /workspace/vercel_backup.dump

docker run -v $PWD:/workspace postgres:15.5-alpine \
    pg_restore -d "postgres://postgres:mysecretpassword@host.docker.internal:5432/mydb" -F c -c /workspace/vercel_backup.dump

rm vercel_backup.dump
