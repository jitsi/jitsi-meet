import os
import datetime

class Xcodebuild:

    @staticmethod
    def current_archive_path():
        # The default archives path is as follows
        #
        #    /Users/<USER>/Library/Developer/Xcode/Archives/<YYYY>-<MM>-<DD>
        #
        home = os.path.expanduser("~")
        archives_path = os.path.join(home, "Library/Developer/Xcode/Archives")

        if not os.path.isdir(archives_path):
            exit("error: Xcode archives directory not found at {}".format(archives_path))

        dirname = str(datetime.date.today())
        archive_path = os.path.join(archives_path, dirname)

        if not os.path.exists(archive_path):
            os.makedirs(archive_path)

        return archive_path
