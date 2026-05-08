import { Href, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: Href }
) {
  return (
    <Link
      {...props}
      href={props.href}
      onPress={(e) => {
        e.preventDefault();
        WebBrowser.openBrowserAsync(String(props.href));
      }}
    />
  );
}
