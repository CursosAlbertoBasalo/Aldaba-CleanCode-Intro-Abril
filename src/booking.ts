// ToDo: 💩 🤢 PascalCase or SCREAM_CASE
export enum BookingStatus {
  requested,
  paid,
  reserved,
  notified_reserve,
}

// ToDo: 💩 🤢 Bad variable names

export class Booking {
  public id: string | undefined;
  public tripId: string;
  public travelerId: string;
  public passengers: number;
  public status: BookingStatus = BookingStatus.requested;
  public price = 0;
  public hasPremiumFoods = false;
  public extraLuggageInt = 0;
  public agencyReserveCode: string | undefined;
  public paymentId: string | undefined;
  constructor(tripId: string, travelerId: string, passengersCount: number) {
    this.tripId = tripId;
    this.travelerId = travelerId;
    this.passengers = passengersCount;
  }
}
