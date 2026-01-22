-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContributionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "actualTotal" REAL NOT NULL DEFAULT 0,
    "amountSpent" REAL NOT NULL DEFAULT 0,
    "expenseReason" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MONTHLY',
    "monthlyAmount" REAL NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContributionEvent" ("actualTotal", "amountSpent", "createdAt", "date", "expenseReason", "id", "locked", "name", "type") SELECT "actualTotal", "amountSpent", "createdAt", "date", "expenseReason", "id", "locked", "name", "type" FROM "ContributionEvent";
DROP TABLE "ContributionEvent";
ALTER TABLE "new_ContributionEvent" RENAME TO "ContributionEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
