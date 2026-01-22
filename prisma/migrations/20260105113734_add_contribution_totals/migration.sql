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
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContributionEvent" ("createdAt", "date", "id", "locked", "name", "type") SELECT "createdAt", "date", "id", "locked", "name", "type" FROM "ContributionEvent";
DROP TABLE "ContributionEvent";
ALTER TABLE "new_ContributionEvent" RENAME TO "ContributionEvent";
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "idNumber" TEXT,
    "birthDate" DATETIME,
    "memberType" TEXT NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("createdAt", "email", "fullName", "id", "passwordHash", "phone", "roleId") SELECT "createdAt", "email", "fullName", "id", "passwordHash", "phone", "roleId" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX "Member_idNumber_key" ON "Member"("idNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
