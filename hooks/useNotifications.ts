"use client";

import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  getNotificationPermissionState,
} from "@/services/notifications/notificationService";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");

  useEffect(() => {
    setPermission(getNotificationPermissionState());
  }, []);

  const requestPermission = async () => {
    const p = await requestNotificationPermission();
    setPermission(p);
    return p;
  };

  return { permission, requestPermission };
}
