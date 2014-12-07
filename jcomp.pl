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

sub Read
{
  my $self = shift;
  open(my $fh, '<', $self->{file}) or die "Can't open $self->{file} for reading: $!\n";
  while (<$fh>)
  {
    chomp(); # remove tailing whitespace
    my $parseTo = index($_, $comment);

    my $line = $_;
    $line = substr($_, 0, $parseTo) if ($parseTo >= 0); # chop of comments
    my @tokens = split(/[:,] /, $line);

    my $param =  shift(@tokens);
    $self->{config}->{$param} = join(' ', @tokens); # store the values as a space deliminated list 
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

## end of Config

package Source;

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  $self->{text} = undef;
  return $self;
}

sub Read
{
  my $self = shift;

  open(my $fh, '<', $self->{file}) or die "Couldn't open $self->{file} for reading: $!\n";
  my @lines = <$fh>;
  close($fh);
  $self->{text} = \@lines;
}

sub Write
{
  my $self = shift;
  my $target = shift;

  open(my $fh, '>', $target) or die "Couldn't open $target for writing: $!\n";
  print $fh @{$self->{text}};
  close($fh);
}

sub ScrubSingleLineComments
{
  my $self = shift;

  if (!defined $self->{text})
  {
    $self->Read();
  }
  my @lines = @{$self->{text}};
  print "@lines\n";
  for (my $i = 0; $i <= $#lines; $i++)
  {
    my $comment = index($lines[$i], '//');
    if ($comment >= 0)
    {
      $lines[$i] = substr($lines[$i], 0, $comment);
    }
  }
  $self->{text} = \@lines;
}

## end of Source

# main
package main;

use Data::Dumper;
my $configFile = '';

# get our args
foreach my $ARG (@ARGV)
{
  $configFile = substr($ARG, 3) if (index($ARG, '-c=') != -1);
  help() if ($ARG eq '-h');
}

my $config = Config->new($configFile); # create config file object

$config->Read(); # read in data

my $fileList = $config->GetParam('sources');
my @files = split(' ', $fileList);
for (my $i = 0; $i <= $#files; $i++)
{
  $files[$i] = Source->new($files[$i]); # repopulate file list with Source objects
  $files[$i]->ScrubSingleLineComments();
  $files[$i]->Write($config->GetParam('target'));
}

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