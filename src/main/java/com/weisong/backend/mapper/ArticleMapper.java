package com.weisong.backend.mapper;

import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import org.apache.ibatis.annotations.*;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */
@Mapper
@Repository
public interface ArticleMapper {

//    查询所有帖子
    @Select("select * from article")
    List<Article> getAllArticle();


//    添加文章
    @Insert("insert into article(uuid,title,article,read,like,answer,createDate,updateDate,name,categoryId) " +
            "values(#{uuid},#{title},#{article},#{read},#{answer},#{createDate},#{updateDate},#{name},#{categoryId})")
    List<Article> addArticle(String uuid, String title, String article, Integer read, Integer like, Integer answer, Date createDate, Date updateDate, String name, String categoryId);

//    删除文章
    @Delete("delete from article where uuid=#{uuid}")
    void deleteArticleById(@Param("uuid") String uuid);


}
