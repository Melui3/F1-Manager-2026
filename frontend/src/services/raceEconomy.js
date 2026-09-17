const GP_BUDGET = [5, 4, 3.5, 3, 2.5, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.4, 0.4, 0.3, 0.3];
const SPRINT_BUDGET = [2, 1.5, 1.2, 1, 0.8, 0.7, 0.6, 0.5, 0.5, 0.4, 0.4, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1];

export function earnedBudget(position, sessionType) {
    const table = sessionType === "GP" ? GP_BUDGET : SPRINT_BUDGET;
    return (table[Math.max(0, (position || 22) - 1)] ?? 0.1) * 1_000_000;
}
