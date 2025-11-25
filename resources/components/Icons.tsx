import React from "react";

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
    fill?: string;
    viewBox?: string;
    "aria-hidden"?: boolean;
}

export const EditIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
);

export const DateIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M11 14v-2h2v2h-2zm-4 0v-2h2v2H7zm8 0v-2h2v2h-2zm-4 4v-2h2v2h-2zm-4 0v-2h2v2H7zm8 0v-2h2v2h-2zM3 22V4h3V2h2v2h8V2h2v2h3v18H3zm2-2h14V10H5v10zM5 8h14V6H5v2z"></path>
    </svg>
);

export const BillingIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M2 20V4h20v16H2zM4 8h16V6H4v2zm0 10h16v-6H4v6z"></path>
    </svg>
);

export const StampIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

export const AddUserIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 640 512",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M136 128a120 120 0 1 1 240 0 120 120 0 1 1 -240 0zM48 482.3C48 383.8 127.8 304 226.3 304l59.4 0c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3zM544 96c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24z" />
    </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({
    width = 22,
    height = 22,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
    </svg>
);

export const SaveIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-10H6V5h9v2z" />
    </svg>
);

export const SignatureIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M8 6.95L12.95 2l1.06 1.06-4.95 4.95L8 6.95zm11.36-1.47l-2.83-2.83L6.17 13.01l-1.44 4.27L9 15.84 19.36 5.48zM3 21.01h18v-2H3v2z" />
    </svg>
);

export const StampPlaceholderIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <g clipPath="url(#a)">
            <path
                fillRule="evenodd"
                d="m12 11 1.79-5.483C13.696 4.707 12.977 4 12 4c-.976 0-1.694.701-1.79 1.508zm2 0 1.8-5.308C15.798 3.652 14.097 2 12 2c-1.341 0-2.52.674-3.196 1.692a3.6 3.6 0 0 0-.605 2h.002L10 11H4v6h16v-6zm7 8H3v2h18z"
                clipRule="evenodd"
            />
        </g>
        <defs>
            <clipPath id="a">
                <path d="M0 0h24v24H0z" />
            </clipPath>
        </defs>
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

export const InitialsIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            fill={fill}
            className={className}
            {...props}
        >
            <path
                d="M2 20.995v-2h20v2H2zm2-5.083V4h2v11.912H4zM18 4h2v11.912h-2L12 7.25v8.663h-2V4h2l6 8.663V4z"
            ></path>
        </svg>
    </svg>
);

export const TextIcon: React.FC<IconProps> = ({
    width = 18,
    height = 18,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M19 21V3h2v18h-2zM9.19 6.106h1.62L16 17.959h-2l-1.132-2.735H7.132L6 17.959H4L9.19 6.106zM10 8.84L8.146 13.4h3.708L10 8.841z" fill-rule="evenodd"/>
    </svg>
);  

export const RecipeentIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 640 512",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M136 128a120 120 0 1 1 240 0 120 120 0 1 1 -240 0zM48 482.3C48 383.8 127.8 304 226.3 304l59.4 0c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3zM544 96c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24z"/>
    </svg>
);

export const TrashIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.019 4V3H9v1H4v2h1v15h14V6h1V4h-4.981zM9 17V8h2v9H9zm6 0h-2V8h2v9z"/>
    </svg>
);

export const SendIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "",
    fill = "currentColor",
    viewBox = "0 0 24 24",
    ...props
}) => (
    <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill={fill}
        className={className}
        {...props}
    >
        <path d="M3.4 20.4l18.3-8.3c.9-.4.9-1.7 0-2.1L3.4 1.7A1 1 0 0 0 2 2.7l1.5 6.1 11.2 3.2-11.2 3.2L2 21.3a1 1 0 0 0 1.4 1.1z"/>
    </svg>
);