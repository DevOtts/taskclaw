"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface UseSlideInWithUrlOptions {
  baseUrl: string;
  createPath?: string;
  editPath?: string;
}

export function useSlideInWithUrl(options: UseSlideInWithUrlOptions) {
  const { baseUrl, createPath = "/create", editPath = "/edit" } = options;
  const pathname = usePathname();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const createUrl = baseUrl + createPath;
    const editUrlPattern = baseUrl + editPath + "/";

    if (pathname === createUrl) {
      setIsCreateOpen(true);
      setEditingId(null);
    } else if (pathname.startsWith(editUrlPattern)) {
      const idPart = pathname.slice(editUrlPattern.length);
      const id = idPart.split("/")[0].split("?")[0];
      if (id) {
        setEditingId(id);
        setIsCreateOpen(false);
      }
    } else {
      const nextjsEditPattern = new RegExp(
        `^${baseUrl.replace(/\//g, "\\/")}\\/([^/]+)\\/edit$`
      );
      const editMatch = pathname.match(nextjsEditPattern);
      if (editMatch && editMatch[1]) {
        setEditingId(editMatch[1]);
        setIsCreateOpen(false);
      } else {
        setIsCreateOpen(false);
        setEditingId(null);
      }
    }

    setIsInitialized(true);
  }, [pathname, baseUrl, createPath, editPath]);

  const openCreate = () => {
    setIsCreateOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    router.push(baseUrl);
  };

  const closeEdit = () => {
    setEditingId(null);
    router.push(baseUrl);
  };

  const getCreateUrl = () => baseUrl + createPath;
  const getEditUrl = (id: string) => {
    if (!id?.trim()) {
      throw new Error("ID is required for edit URL");
    }
    return baseUrl + "/" + id + "/edit";
  };

  return {
    isCreateOpen,
    editingId,
    openCreate,
    openEdit,
    closeCreate,
    closeEdit,
    getCreateUrl,
    getEditUrl,
    isInitialized,
  };
}
