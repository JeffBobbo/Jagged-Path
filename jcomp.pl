#!/usr/bin/perl

# writing this in perl for now, but may port to ruby as I'm interested to learn
# decided ruby sucks

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

my $comment = '#'; # what denotes a comment in the configuration file

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  return $self;
}

sub File
{
  my $self = shift;
  return $self->{file};
}

use Data::Dumper;

sub Read
{
  my $self = shift;
  open(my $fh, '<', $self->{file}) or die "Can't open $self->{file} for reading: $!\n";
  while (<$fh>)
  {
    my $parseTo = index($_, $comment); # might not need this

    my $line = substr($_, 0, index($_, $comment));
    my @tokens = split(/[:,] /, $line);

    my $param =  shift(@tokens);
    $self->{config}->{$param} = join("|", @tokens); # store the values as a pipe deliminated list 
  }
  close($fh);
}

sub GetParam
{
  my $self = shift;
  my $param = shift;

  if (defined $param)
  {
    return $self->{config}->{$param}
  }
  return undef;
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

my $config = Config->new($configFile); # create config file object

$config->Read(); # read in data

exit(0);

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