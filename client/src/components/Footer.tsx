export default function Footer() {
  return (
    <footer className="border-t border-[#323232] py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>
              <path d="M12 10.5C15 10.5 15 7.5 12 7.5C9 7.5 9 10.5 12 10.5Z" fill="white"/>
              <path d="M12 13.5C9 13.5 9 16.5 12 16.5C15 16.5 15 13.5 12 13.5Z" fill="white"/>
            </svg>
            <div className="text-sm">
              <div className="font-['Roboto']">OmniGovern DAO</div>
              <div className="text-xs secondary-text font-['Roboto_Mono']">© {new Date().getFullYear()} OmniGovern Labs</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="text-xs secondary-text font-['Roboto_Mono'] mr-4">POWERED BY</div>
            <svg className="h-5 w-auto" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z" fill="white"/>
              <path d="M27 7H23V17H25V13H27C29.21 13 31 11.21 31 9C31 6.79 29.21 5 27 5ZM27 11H25V7H27C28.1 7 29 7.9 29 9C29 10.1 28.1 11 27 11Z" fill="white"/>
              <path d="M39 9H37V7H35V9H33V11H35V15C35 16.1 35.9 17 37 17H39V15H37V11H39V9Z" fill="white"/>
              <path d="M49 9C48.45 9 47.95 9.15 47.52 9.41C47.21 9.58 46.94 9.84 46.71 10.12C46.33 9.43 45.62 9 44.83 9C44.37 9 43.94 9.13 43.57 9.35C43.4 9.45 43.25 9.58 43.12 9.71V9H41V17H43V13C43 11.9 43.9 11 45 11C46.1 11 47 11.9 47 13V17H49V13C49 11.9 49.9 11 51 11C52.1 11 53 11.9 53 13V17H55V12.5C55 10.57 53.43 9 51.5 9C50.54 9 49.68 9.37 49 9.96C48.85 9.64 48.68 9.35 48.45 9.12C48.32 9 48.17 8.87 48 8.78Z" fill="white"/>
              <path d="M64 9H62V10.08C61.44 9.38 60.53 9 59.58 9C57.16 9 55.18 11.09 55.18 13.5C55.18 15.91 57.16 18 59.58 18C60.53 18 61.44 17.62 62 16.92V18H64V9ZM59.67 16C58.19 16 57 14.81 57 13.33C57 11.85 58.19 10.67 59.67 10.67C61.14 10.67 62.33 11.85 62.33 13.33C62.33 14.81 61.14 16 59.67 16Z" fill="white"/>
              <path d="M73 9C72.45 9 71.95 9.15 71.52 9.41C71.21 9.58 70.94 9.84 70.71 10.12C70.33 9.43 69.62 9 68.83 9C68.37 9 67.94 9.13 67.57 9.35C67.4 9.45 67.25 9.58 67.12 9.71V9H65V17H67V13C67 11.9 67.9 11 69 11C70.1 11 71 11.9 71 13V17H73V13C73 11.9 73.9 11 75 11C76.1 11 77 11.9 77 13V17H79V12.5C79 10.57 77.43 9 75.5 9C74.54 9 73.68 9.37 73 9.96C72.85 9.64 72.68 9.35 72.45 9.12C72.32 9 72.17 8.87 72 8.78Z" fill="white"/>
              <path d="M85 5H83V9H81V11H83V14C83 15.65 84.35 17 86 17H87V15H86C85.45 15 85 14.55 85 14V11H87V9H85V5Z" fill="white"/>
              <path d="M97 9H95V10.08C94.44 9.38 93.53 9 92.58 9C90.16 9 88.18 11.09 88.18 13.5C88.18 15.91 90.16 18 92.58 18C93.53 18 94.44 17.62 95 16.92V18H97V9ZM92.67 16C91.19 16 90 14.81 90 13.33C90 11.85 91.19 10.67 92.67 10.67C94.14 10.67 95.33 11.85 95.33 13.33C95.33 14.81 94.14 16 92.67 16Z" fill="white"/>
              <path d="M102 9H100V11H102V17H104V11H106V9H104V8.5C104 7.67 104.67 7 105.5 7H106V5H105C103.34 5 102 6.34 102 8V9Z" fill="white"/>
              <path d="M113 9C110.79 9 109 10.79 109 13C109 15.21 110.79 17 113 17C115.21 17 117 15.21 117 13C117 10.79 115.21 9 113 9ZM113 15C111.9 15 111 14.1 111 13C111 11.9 111.9 11 113 11C114.1 11 115 11.9 115 13C115 14.1 114.1 15 113 15Z" fill="white"/>
            </svg>
          </div>
        </div>
        
        <div className="text-center text-xs tertiary-text mt-6 font-['Roboto']">
          OmniGovern DAO enables decentralized autonomous organizations to propose, vote, and execute governance decisions natively across 10+ blockchains.
        </div>
      </div>
    </footer>
  );
}
