-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContributionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MONTHLY',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContributionEvent" ("createdAt", "date", "id", "locked", "name") SELECT "createdAt", "date", "id", "locked", "name" FROM "ContributionEvent";
DROP TABLE "ContributionEvent";
ALTER TABLE "new_ContributionEvent" RENAME TO "ContributionEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
