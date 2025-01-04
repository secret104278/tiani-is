import type { ImageProps } from "next/image";
import Image from "next/image";

export default function LineImage(props: ImageProps) {
  return <Image width={800} height={800} {...props} />;
}
