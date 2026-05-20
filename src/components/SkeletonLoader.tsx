import React from "react";

export const SkeletonCard = () => {
  return (
    <div className="glass rounded-[2rem] overflow-hidden border border-gold-300/20 dark:border-white/5 p-4 flex flex-col gap-4 animate-pulse">
      <div className="aspect-[4/5] bg-stone-300/40 dark:bg-white/5 rounded-2xl w-full" />
      <div className="flex justify-between items-center px-2">
        <div className="space-y-2 w-2/3">
          <div className="h-3 bg-stone-300/40 dark:bg-white/5 rounded w-3/4" />
          <div className="h-2 bg-stone-300/30 dark:bg-white/5 rounded w-1/2" />
        </div>
        <div className="h-4 bg-stone-300/40 dark:bg-white/5 rounded w-12" />
      </div>
    </div>
  );
};

export const SkeletonDetail = () => {
  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse px-4 py-8">
      {/* 2D/3D Viewer area */}
      <div className="md:col-span-6 flex flex-col gap-4">
        <div className="aspect-[4/3] rounded-[2.5rem] bg-stone-300/40 dark:bg-white/5 w-full min-h-[380px]" />
        <div className="flex gap-4 justify-center">
          <div className="w-20 h-20 rounded-2xl bg-stone-300/40 dark:bg-white/5" />
          <div className="w-20 h-20 rounded-2xl bg-stone-300/40 dark:bg-white/5" />
          <div className="w-20 h-20 rounded-2xl bg-stone-300/40 dark:bg-white/5" />
        </div>
      </div>

      {/* Info details */}
      <div className="md:col-span-6 space-y-6">
        <div className="space-y-3">
          <div className="h-3 bg-stone-300/30 dark:bg-white/5 rounded w-24" />
          <div className="h-10 bg-stone-300/40 dark:bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-stone-300/30 dark:bg-white/5 rounded w-1/3" />
        </div>

        <div className="h-[1px] bg-stone-300/30 dark:bg-white/5 my-4" />

        <div className="h-20 bg-stone-300/30 dark:bg-white/5 rounded-2xl w-full" />

        <div className="space-y-2">
          <div className="h-2 bg-stone-300/30 dark:bg-white/5 rounded w-1/3" />
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-300/40 dark:bg-white/5" />
            <div className="w-10 h-10 rounded-full bg-stone-300/40 dark:bg-white/5" />
            <div className="w-10 h-10 rounded-full bg-stone-300/40 dark:bg-white/5" />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <div className="h-14 bg-stone-300/40 dark:bg-white/5 rounded-2xl flex-1" />
          <div className="h-14 bg-stone-300/40 dark:bg-white/5 rounded-2xl w-14" />
        </div>
      </div>
    </div>
  );
};
