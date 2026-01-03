import type { ImgHTMLAttributes } from "react";

type Props = {
  imageProps: ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
  };
  containerStyles?: string;
};

function ImageContainer({ containerStyles, imageProps }: Props) {
  const { alt, src, ...restProps } = imageProps;
  return (
    <div
      className={`overflow-hidden w-full h-full relative ${containerStyles}`}
    >
      <img
        alt={alt}
        src={src}
        className="object-cover w-full h-full"
        {...restProps}
      />
    </div>
  );
}

export default ImageContainer;
