#!/usr/bin/perl

# writing this in perl for now, but may port to ruby as I'm interested to learn

# script functionality:
# concatenate js files together
# remove comments
# remove whitespace
# add license at start
# ignore json
# rule file
# parse html and edit scripts

use warnings;
use strict;

# config class?
package Config;

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  return $self;
}

sub file
{
  my $self = shift;
  return $self->{file};
}

sub read
{
  my $self = shift;
  open(my $fh, '<', $self->{file}) or die "Can't open $self->{file} for reading: $!\n";
  while (<$fh>)
  {
    if ($_ =~ /^#/)
    {
      next;
    }
  }
}

# main
package main;

use Getopt::Long;

my $configFile = "";

# get our args
GetOptions(
  'help'   => \&help, # this exits for us
  'conf=s' => \$configFile
);

print "$configFile\n";

my $config = Config->new($configFile);

print $config->file(), "\n";

sub help
{
  print <<EOH;
$0 - JavaScript deployment script for Jagged Path

Options:
--help
    Displays this text.

--conf=file
    Configuration file to do the deployment for

EOH
  exit(0);
}