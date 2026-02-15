import BookingModule from "./booking/BookingModule.jsx";
import FriendsModule from "./friends/FriendsModule.jsx";
import WallModule from "./wall/WallModule.jsx";
import AchievementsModule from "./achievements/AchievementsModule.jsx";
import GalleryModule from "./gallery/GalleryModule.jsx";
import StatsModule from "./StatsModule.jsx";

export const moduleRegistry = {
  booking: BookingModule,
  friends: FriendsModule,
  wall: WallModule,
  achievements: AchievementsModule,
  gallery: GalleryModule,
  stats: StatsModule,
};
