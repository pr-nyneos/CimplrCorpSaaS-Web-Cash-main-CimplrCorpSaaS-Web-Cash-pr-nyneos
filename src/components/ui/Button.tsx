'use client'

import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  categories?:'Large' | 'Medium';
  color?: 'Green' | 'NonPrimary' | 'Disable' | 'Blue' | 'Fade';
};

const Button: React.FC<ButtonProps> = ({ children,categories='Large',color='Green', ...props }) => {

    const BaseColor = {
        Green : 'bg-primary hover:bg-primary-hover text-white border-2 border-primary',
        NonPrimary : 'bg-primary-fade hover:bg-primary-lt text-white',
        Disable : 'bg-primary-fade text-white border-2 border-primary cursor-not-allowed',
        Fade : 'text-primary-fade hover:text-primary bg-[#13595407] border-2 border-primary-fade',
        Blue : 'bg-blue-500 hover:bg-blue-700 text-white',
        } [color] ?? 'bg-green-500 hover:bg-green-700'

    const BaseCategory = {
        Large : 'px-4 py-2 font-bold w-full h-[40px]',
        Medium : 'px-4 py-1.5 font-medium w-full',
    }[categories] ?? 'px-4 py-2 font-bold'


    return (
        <button
            className={`${BaseColor} text-center rounded ${BaseCategory} transition`}
            {...props}
        >
            {children}
        </button>
    );
};


export default Button;
