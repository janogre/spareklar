export interface Testimonial {
  quote: string;
  name: string;
  location: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Fant ut at jeg betalte for to nettleier jeg ikke brukte. Spart 1 800 kr i måneden!",
    name: "Thomas B.",
    location: "Oslo",
  },
  {
    quote:
      "Tok 30 sekunder og ga meg tre konkrete ting å gjøre. Imponerende.",
    name: "Marte L.",
    location: "Bergen",
  },
  {
    quote:
      "Endelig noe som faktisk ser på mine egne tall i stedet for generelle råd.",
    name: "Kristoffer A.",
    location: "Trondheim",
  },
];
