# coding: utf-8
#
require 'sinatra'
require 'json'
require_relative '../models/player'
require_relative '../models/queue'
require 'redis'

module Jockey
  class App < Sinatra::Base
    get '/api/history', provides: :json do
      Queue.history.map(&:to_hash).to_json
    end

    get '/api/upcoming', provides: :json do
      Queue.upcoming.map(&:to_hash).to_json
    end

    get '/api/playing', provides: :json do
      Player.playing.to_hash.to_json
    end

    get '/api/search', provides: :json do
      return halt 400 unless params[:q]

      result = Player.search(*(params[:q].split(/[ 　]/)))
      result[:songs].map!(&:to_hash)
      result.to_json
    end

    get '/api/album/:name', provides: :json do
      album = Player.album(params[:name])
      return halt 404 unless album
      album.map(&:to_hash).to_json
    end

    get '/api/artist/:name' do
      artist = Player.artist(params[:name])
      return halt 404 unless artist
      artist.map(&:to_hash).to_json
    end

    get '/artworks/album/:name.png', provides: 'image/png' do
      if artwork = Player.artwork(params[:name])
        response['Cache-Control'] = 'public, max-age=86400'
        etag "album#{params[:name]}"
        artwork
      else
        redirect '/placeholder.png'
      end
    end

    get '/artworks/:id.png', provides: 'image/png' do
      song = Song.find(params[:id])
      return halt 404 unless song

      if artwork = song.artwork
        response['Cache-Control'] = 'public, max-age=86400'
        etag params[:id]
        artwork
      else
        redirect '/placeholder.png'
      end
    end

    post '/api/enque', provides: :json do
      return halt 400 unless params[:id]

      songs = params[:id].split(/,/).map{|x| Song.find(x) }.compact
      code =Queue.enque(*songs)
      puts code
      if code == 123
        print "uh already voted cannot vote `-`"
        return {code:123, done:false}.to_json
      end
      {done: true}.to_json
    end
    post '/api/dedicate', provides :json do
      return halt 400 unless params[:id].blank? && params[:message].blank?
      print "hello message" + params[:message].to_s
      songs = params[:id].split(/,/).map{|x| Song.find(x) }.compact
      r = Redis.new
      r.hmset('msg:' + song.id, params[:message].to_s)
      r.quit
      {done: true}.to_json
  end
end
