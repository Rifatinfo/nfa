"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Cover() {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="text-5xl font-semibold tracking-tight text-white md:text-6xl"
        >
          Conversion of ε-NFA to DFA
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="mx-auto my-10 h-px w-24 bg-indigo-400/60"
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
        >
          <div className="text-2xl font-medium text-slate-100">Md Rifat Hossain</div>
          <div className="mt-2 font-mono text-lg text-slate-400">ID: 243014079</div>
        </motion.div>
      </div>
    </div>
  );
}
