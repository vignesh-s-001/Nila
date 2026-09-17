import type { Rule, UserContext, ContextEvent } from "@/core/types";

export interface RuleExecutionResult {
  rule: Rule;
  actionsTriggered: string[];
}

/**
 * Pure function to evaluate which rules should fire based on context.
 */
export function evaluateRules(context: UserContext, rules: Rule[]): RuleExecutionResult[] {
  const { event, currentPlace } = context;
  
  if (!currentPlace || event === "NONE" || event === "MOVING") {
    return [];
  }

  const results: RuleExecutionResult[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
  const currentDay = now.getDay(); // 0 = Sun, 6 = Sat

  for (const rule of rules) {
    if (!rule.enabled || rule.placeId !== currentPlace.id || rule.triggerEvent !== event) {
      continue;
    }

    // Check conditions
    const cond = rule.conditions;
    let conditionsMet = true;

    // Time window condition
    if (cond.timeStart && cond.timeEnd) {
      if (cond.timeStart <= cond.timeEnd) {
        // e.g. 09:00 to 17:00
        if (currentTimeStr < cond.timeStart || currentTimeStr > cond.timeEnd) {
          conditionsMet = false;
        }
      } else {
        // spans midnight e.g. 22:00 to 06:00
        if (currentTimeStr < cond.timeStart && currentTimeStr > cond.timeEnd) {
          conditionsMet = false;
        }
      }
    }

    // Days condition
    if (cond.days && cond.days.length > 0) {
      if (!cond.days.includes(currentDay)) {
        conditionsMet = false;
      }
    }

    // (stayDuration is typically handled asynchronously, so we ignore it here for pure evaluation)

    if (conditionsMet) {
      results.push({
        rule,
        actionsTriggered: rule.actions,
      });
    }
  }

  return results;
}
