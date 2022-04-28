import { BookingDto } from "./booking.dto";
import { BookingStatus } from "./booking_status.enum";
import { DataBase } from "./data_base";
import { DateRangeVo } from "./date_range.vo";
import { FindTripsDto } from "./find_trips.dto";
import { NotificationsService } from "./notifications.service";
import { SmtpService } from "./smtp.service";
import { TravelerDto } from "./traveler.dto";
import { TripDto } from "./trip.dto";
import { TripStatus } from "./trip_status.enum";

export class TripsService {
  private tripId = "";
  private trip!: TripDto;
  public cancelTrip(tripId: string) {
    // * 🧼 🚿 CLEAN:  Saved as a properties on the class to reduce method parameters
    this.tripId = tripId;
    this.trip = this.updateTripStatus();
    this.cancelBookings();
  }

  public findTrips(findTripsDTO: FindTripsDto): TripDto[] {
    // * 🧼 🚿 CLEAN:  date range ensures the range is valid
    const dates = new DateRangeVo(findTripsDTO.startDate, findTripsDTO.endDate);
    return this.selectTrips(findTripsDTO.destination, dates);
  }

  private selectTrips(destination: string, dates: DateRangeVo) {
    const trips: TripDto[] = DataBase.select<TripDto>(
      `SELECT * FROM trips WHERE destination = '${destination}' AND start_date >= '${dates.start}' AND end_date <= '${dates.end}'`,
    );
    return trips;
  }

  private updateTripStatus() {
    const trip: TripDto = this.selectTrip();
    trip.status = TripStatus.CANCELLED;
    this.updateTrip(trip);
    return trip;
  }

  private updateTrip(trip: TripDto) {
    DataBase.update(trip);
  }

  private selectTrip() {
    return DataBase.selectOne<TripDto>(`SELECT * FROM trips WHERE id = '${this.tripId}'`);
  }

  private cancelBookings() {
    const bookings: BookingDto[] = this.selectBookings();
    if (this.hasNoBookings(bookings)) {
      return;
    }
    const smtp = new SmtpService();
    for (const booking of bookings) {
      this.cancelBooking(booking, smtp, this.trip);
    }
  }

  private selectBookings() {
    return DataBase.select<BookingDto>("SELECT * FROM bookings WHERE trip_id = " + this.tripId);
  }

  private hasNoBookings(bookings: BookingDto[]) {
    return !bookings || bookings.length === 0;
  }

  private cancelBooking(booking: BookingDto, smtp: SmtpService, trip: TripDto) {
    this.updateBookingStatus(booking);
    this.notifyTraveler(booking, smtp, trip);
  }

  private notifyTraveler(booking: BookingDto, smtp: SmtpService, trip: TripDto) {
    const traveler = this.selectTraveler(booking.travelerId);
    if (!traveler) {
      return;
    }
    const notifications = new NotificationsService();
    notifications.notifyTripCancellation({
      recipient: traveler.email,
      tripDestination: trip.destination,
      bookingId: booking.id,
    });
  }

  private selectTraveler(travelerId: string) {
    return DataBase.selectOne<TravelerDto>(`SELECT * FROM travelers WHERE id = '${travelerId}'`);
  }

  private updateBookingStatus(booking: BookingDto) {
    booking.status = BookingStatus.CANCELLED;
    DataBase.update(booking);
  }
}
