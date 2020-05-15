#!/usr/bin/env perl

# preprocess HTML file and replace Server Side Includes statically
#
# Usage: ./preprocesshtml.pl input.html builddir/output.html
#
# (C) 2020 J. Bartels

use File::Basename;

my $inputfile = $ARGV[0];
my $outputfile = $ARGV[1];

my $path = dirname( $inputfile ); # extract path

# read file, process includes and return complete content
# param: $filename string
# returns: $content string
sub processFile {
        my $file = shift(@_);

        local *FILE;
        open( FILE,"<$file") or die "$! $file";
        my $content = '';
        while( my $line = <FILE> ) {
                $content .= $line;
        }
        close(FILE);

        $content =~ s/<!--\s*#include\s+virtual\s*=\s*"\/?([\/a-zA-Z0-9_\-\.]+)"\s*-->/processFile( $path . '\/' . $1 )/gme;

	return $content;
}

# process inputfile and write outputfile
open( OUT, ">$outputfile" ) or die ( "$! $outputfile" );
print OUT processFile( $inputfile );
close(OUT);
