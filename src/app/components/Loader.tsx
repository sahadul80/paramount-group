"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function ParamountLoader() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black/50 backdrop-blur-md">
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.8, 1, 1.2, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/p1.png"
          alt="Paramount Logo"
          width={30}
          height={30}
          className="drop-shadow-xl"
        />
      </motion.div>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1, 0.8, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/p2.png"
          alt="Paramount Logo"
          width={30}
          height={30}
          className="drop-shadow-xl"
        />
      </motion.div>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.8, 1, 1.2, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/p3.png"
          alt="Paramount Logo"
          width={30}
          height={30}
          className="drop-shadow-xl"
        />
      </motion.div>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1, 0.8, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/p4.png"
          alt="Paramount Logo"
          width={30}
          height={30}
        />
      </motion.div>
    </div>
  );
}
