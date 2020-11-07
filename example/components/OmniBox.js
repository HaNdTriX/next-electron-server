import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function OmniBox({ placeholder }) {
  const ref = useRef();
  const { push } = useRouter();

  useEffect(() => {
    ref.current.value = location.href;
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const url = ref.current.value;
    push(url);
  };

  return (
    <form onSubmit={handleSubmit}>
      <style jsx>{`
        input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px;
        }
      `}</style>
      <input ref={ref} type="url" name="url" placeholder={placeholder} />
    </form>
  );
}
