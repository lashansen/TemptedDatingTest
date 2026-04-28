import React from 'react';
import { User } from 'lucide-react';

interface CouplePhotoProps {
  url1: string;
  url2: string;
  size?: number;
  className?: string;
}

export function CouplePhoto({ url1, url2, size = 80, className = '' }: CouplePhotoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <div className="absolute inset-0 flex">
        <div className="w-1/2 overflow-hidden">
          {url1 ? (
            <img
              src={url1}
              alt="Person 1"
              className="h-full object-cover"
              style={{ width: size, objectPosition: 'center center' }}
            />
          ) : (
            <div className="h-full w-full bg-rose-800 flex items-center justify-center">
              <User size={size * 0.3} className="text-white" />
            </div>
          )}
        </div>
        <div className="w-1/2 overflow-hidden">
          {url2 ? (
            <img
              src={url2}
              alt="Person 2"
              className="h-full object-cover"
              style={{ width: size, objectPosition: 'center center' }}
            />
          ) : (
            <div className="h-full w-full bg-pink-800 flex items-center justify-center">
              <User size={size * 0.3} className="text-white" />
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent calc(50% - 1px), rgba(0,0,0,0.6) 50%, transparent calc(50% + 1px))',
        }}
      />
    </div>
  );
}

interface CouplePhotoBannerProps {
  url1: string;
  url2: string;
  className?: string;
}

export function CouplePhotoBanner({ url1, url2, className = '' }: CouplePhotoBannerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex">
        <div className="w-1/2 overflow-hidden">
          {url1 ? (
            <img src={url1} alt="Person 1" className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full bg-rose-900 flex items-center justify-center">
              <User size={48} className="text-white" />
            </div>
          )}
        </div>
        <div className="w-1/2 overflow-hidden">
          {url2 ? (
            <img src={url2} alt="Person 2" className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full bg-pink-900 flex items-center justify-center">
              <User size={48} className="text-white" />
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/60 to-transparent pointer-events-none" style={{ background: 'linear-gradient(to right, transparent calc(50% - 1px), rgba(0,0,0,0.7) 50%, transparent calc(50% + 1px))' }} />
    </div>
  );
}
