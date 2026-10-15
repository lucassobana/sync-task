'use client';

import React, { useState } from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { COLORS, chakraColorOverrides } from '@/theme/colors';

export const theme = extendTheme({
  colors: chakraColorOverrides,
  styles: {
    global: {
      body: {
        bg: COLORS.background,
        color: COLORS.textMain,
      },
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
});

export function Provider({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const c = createCache({ key: 'chakra' });
    c.compat = true;
    const prevInsert = c.insert;
    let inserted: string[] = [];
    c.insert = (...args) => {
      const serialized = args[1];
      if (c.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flushFn = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache: c, flush: flushFn };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
