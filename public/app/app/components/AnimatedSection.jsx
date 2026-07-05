"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function AnimatedSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.2 });

  const variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}