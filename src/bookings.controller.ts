import { BookingDto } from "./booking.dto";
import { BookingsService } from "./bookings.service";
import { BookingsRequestDto } from "./bookings_request.dto";
import { BookingsRequestVo } from "./bookings_request.vo";
import { BookingStatus } from "./booking_status.enum";
import { DataBase } from "./data_base";
import { NotificationsService } from "./notifications.service";

// ToDo : 💩 🤢 Too many responsibilities

export class BookingsController {
  // private booking!: BookingDto;
  // private trip!: TripDto;
  // private traveler!: TravelerDto;
  private bookingsRequestVO!: BookingsRequestVo;
  private bookingsService!: BookingsService;
  /**
   * Requests a new booking
   * @param bookingsRequestDTO - the booking request
   * @returns {BookingDto} the new booking object
   * @throws {Error} if the booking is not possible
   */
  public request(bookingsRequestDTO: BookingsRequestDto): BookingDto {
    this.bookingsRequestVO = new BookingsRequestVo(bookingsRequestDTO);
    this.bookingsService = new BookingsService(this.bookingsRequestVO);
    this.create();
    this.save();
    this.pay();
    this.notify();
    return this.bookingsService.booking;
  }

  // ToDo : 💩 🤢 Side effects
  private create(): void {
    this.bookingsRequestVO.passengersCount = this.bookingsService.getValidatedPassengersCount();
    this.bookingsService.checkAvailability();
    const booking = new BookingDto(
      this.bookingsRequestVO.tripId,
      this.bookingsRequestVO.travelerId,
      this.bookingsRequestVO.passengersCount,
    );
    booking.hasPremiumFoods = this.bookingsRequestVO.hasPremiumFoods;
    booking.extraLuggageKilos = this.bookingsRequestVO.extraLuggageKilos;
  }

  private save() {
    this.booking.id = DataBase.insert<BookingDto>(this.booking);
  }

  private pay() {
    try {
      this.bookingsService.payWithCreditCard(this.bookingsRequestVO.card);
    } catch (error) {
      this.booking.status = BookingStatus.ERROR;
      DataBase.update(this.booking);
      throw error;
    }
  }

  private notify() {
    if (this.booking.id === undefined) {
      return;
    }
    const notifications = new NotificationsService();
    return notifications.notifyBookingConfirmation({
      recipient: this.traveler.email,
      tripDestination: this.trip.destination,
      bookingId: this.booking.id,
    });
  }
}
